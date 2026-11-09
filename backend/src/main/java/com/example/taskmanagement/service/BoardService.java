package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardUpdateRequest;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.dto.ListCreateRequest;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.TaskList;
import com.example.taskmanagement.repository.CardRepository;
import com.example.taskmanagement.repository.LabelRepository;
import com.example.taskmanagement.repository.TaskListRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * ボード・カード・ラベルの処理をまとめたクラス。
 * 基本は読み取り専用で、書き込むメソッドだけに @Transactional を付け直す。
 */
@Service
@Transactional(readOnly = true)
public class BoardService {

	/** リストの数の上限（機能要件 2.2）。 */
	private static final int MAX_LISTS = 10;

	/** 1つのリストに入れられるカードの上限（機能要件 2.2）。 */
	private static final int MAX_CARDS_PER_LIST = 100;

	private final TaskListRepository taskListRepository;
	private final CardRepository cardRepository;
	private final LabelRepository labelRepository;

	public BoardService(TaskListRepository taskListRepository, CardRepository cardRepository,
			LabelRepository labelRepository) {
		this.taskListRepository = taskListRepository;
		this.cardRepository = cardRepository;
		this.labelRepository = labelRepository;
	}

	/** すべてのリストと、その中のカードを返す（リストもカードも並び順どおり）。 */
	public List<BoardListResponse> getBoard() {
		// カードを全部取り出して、リストIDごとに分ける（並び順は保ったまま）
		Map<Long, List<CardResponse>> cardsByListId = cardRepository.findAllByOrderByPositionAsc().stream()
				.map(CardResponse::from)
				.collect(Collectors.groupingBy(CardResponse::listId));

		return taskListRepository.findAllByOrderByPositionAsc().stream()
				.map(list -> BoardListResponse.from(list, cardsByListId.getOrDefault(list.getId(), List.of())))
				.toList();
	}

	/** カードを1枚返す。見つからないときは 404（Not Found）にする。 */
	public CardResponse getCard(Long id) {
		return cardRepository.findById(id)
				.map(CardResponse::from)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません（id=" + id + "）"));
	}

	/**
	 * リストを一番右に追加し、DB に保存する。中のカードは空で返す。
	 * リスト名が空・改行入りなら 400、リストが10個あれば 409 にする。
	 */
	@Transactional
	public BoardListResponse createList(ListCreateRequest request) {
		// 前後の空白を取り除く（空白だけの入力は「空」として扱う）
		String name = request.name().strip();
		if (name.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "リスト名を入力してください。");
		}
		if (name.contains("\n") || name.contains("\r")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "リスト名に改行は入れられません。");
		}
		if (taskListRepository.count() >= MAX_LISTS) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "リストは最大10個まで作成できます。");
		}

		// 一番右のリストの次の番号にする（リストがなければ 0）
		int position = taskListRepository.findTopByOrderByPositionDesc()
				.map(last -> last.getPosition() + 1)
				.orElse(0);

		TaskList saved = taskListRepository.save(new TaskList(name, position));
		return BoardListResponse.from(saved, List.of());
	}

	/**
	 * カードをリストの一番下に追加し、DB に保存する。
	 * タイトルが空・改行入りなら 400、リストがなければ 404、リストに100枚あれば 409 にする。
	 */
	@Transactional
	public CardResponse createCard(CardCreateRequest request) {
		String title = normalizeTitle(request.title());

		Long listId = request.listId();
		if (!taskListRepository.existsById(listId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + listId + "）");
		}
		if (cardRepository.countByListId(listId) >= MAX_CARDS_PER_LIST) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "1つのリストに入れられるカードは最大100枚です。");
		}

		// 一番下のカードの次の番号にする（カードがなければ 0）
		int position = cardRepository.findTopByListIdOrderByPositionDesc(listId)
				.map(last -> last.getPosition() + 1)
				.orElse(0);

		Card saved = cardRepository.save(new Card(listId, title, position));
		return CardResponse.from(saved);
	}

	/**
	 * カードのタイトル・優先度・期限・ラベルを変更し、DB に保存する。
	 * タイトルが空・改行入り、ないラベルなら 400、カードがなければ 404 にする。
	 */
	@Transactional
	public CardResponse updateCard(Long id, CardUpdateRequest request) {
		String title = normalizeTitle(request.title());

		Card card = cardRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません（id=" + id + "）"));

		Long labelId = request.labelId();
		if (labelId != null && !labelRepository.existsById(labelId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ラベルが見つかりません（id=" + labelId + "）");
		}

		// 書き換えるだけで、処理の終わりに JPA が自動で DB に保存する
		card.update(title, request.priority(), request.dueDate(), labelId);
		return CardResponse.from(card);
	}

	/** カードを1枚、DB から削除する。カードがなければ 404 にする。 */
	@Transactional
	public void deleteCard(Long id) {
		if (!cardRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません（id=" + id + "）");
		}
		cardRepository.deleteById(id);
	}

	/** カードのタイトルの前後の空白を取り除き、空・改行入りなら 400 にする（空白だけの入力は「空」として扱う）。 */
	private String normalizeTitle(String rawTitle) {
		String title = rawTitle.strip();
		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "タイトルを入力してください。");
		}
		if (title.contains("\n") || title.contains("\r")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "タイトルに改行は入れられません。");
		}
		return title;
	}

	/** すべてのラベルを、並び順どおりに返す。 */
	public List<LabelResponse> getLabels() {
		return labelRepository.findAllByOrderByPositionAsc().stream()
				.map(LabelResponse::from)
				.toList();
	}
}
