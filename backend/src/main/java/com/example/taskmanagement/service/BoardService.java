package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardBulkDeleteRequest;
import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardMoveRequest;
import com.example.taskmanagement.dto.CardOrderRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardUpdateRequest;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.dto.ListCreateRequest;
import com.example.taskmanagement.dto.ListDoneRequest;
import com.example.taskmanagement.dto.ListRenameRequest;
import com.example.taskmanagement.dto.ListResponse;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.TaskList;
import com.example.taskmanagement.repository.CardRepository;
import com.example.taskmanagement.repository.LabelRepository;
import com.example.taskmanagement.repository.TaskListRepository;
import java.util.ArrayList;
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
		String name = normalizeListName(request.name());
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
	 * リスト名を変更し、DB に保存する。
	 * リスト名が空・改行入りなら 400、リストがなければ 404 にする。
	 */
	@Transactional
	public ListResponse renameList(Long id, ListRenameRequest request) {
		String name = normalizeListName(request.name());
		TaskList list = taskListRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + id + "）"));

		// 書き換えるだけで、処理の終わりに JPA が自動で DB に保存する
		list.rename(name);
		return ListResponse.from(list);
	}

	/**
	 * 完了用リストを指定・解除し、DB に保存する（UC-11）。
	 * 指定するときは、それまで完了用だったリストの指定を外す（完了用リストは1つだけ）。
	 * リストがなければ 404 にする。
	 */
	@Transactional
	public void setListDone(Long id, ListDoneRequest request) {
		TaskList list = taskListRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + id + "）"));

		if (request.isDone()) {
			taskListRepository.findByDoneTrue()
					.filter(current -> !current.getId().equals(id))
					.ifPresent(current -> {
						current.changeDone(false);
						// DB には「完了用リストは1つだけ」のしくみがあるので、先に古い方の解除を DB に書き込んでおく
						// （書き込む順番が逆になると、一瞬だけ完了用が2つになり、DB に断られるため）
						taskListRepository.flush();
					});
		}
		list.changeDone(request.isDone());
	}

	/**
	 * リストを DB から削除する。中のカードは、DB の設定（ON DELETE CASCADE）で一緒に消える。
	 * リストがなければ 404 にする。
	 */
	@Transactional
	public void deleteList(Long id) {
		if (!taskListRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + id + "）");
		}
		taskListRepository.deleteById(id);
	}

	/** リスト名の前後の空白を取り除き、空・改行入りなら 400 にする（空白だけの入力は「空」として扱う）。 */
	private String normalizeListName(String rawName) {
		String name = rawName.strip();
		if (name.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "リスト名を入力してください。");
		}
		if (name.contains("\n") || name.contains("\r")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "リスト名に改行は入れられません。");
		}
		return name;
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

	/**
	 * カードを、指定したリストの index 番目（0 から数える）に動かし、DB に保存する（ドラッグ＆ドロップ）。
	 * 動かす前のリストと動かした先のリストの並び順は、上から 0, 1, 2… と振り直す。
	 * カード・リストがなければ 404、別のリストへ動かすとき、そこに100枚あれば 409 にする。
	 */
	@Transactional
	public void moveCard(Long id, CardMoveRequest request) {
		Card card = cardRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません（id=" + id + "）"));

		Long fromListId = card.getListId();
		Long toListId = request.listId();
		boolean isOtherList = !toListId.equals(fromListId);
		if (isOtherList) {
			if (!taskListRepository.existsById(toListId)) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + toListId + "）");
			}
			if (cardRepository.countByListId(toListId) >= MAX_CARDS_PER_LIST) {
				throw new ResponseStatusException(HttpStatus.CONFLICT, "1つのリストに入れられるカードは最大100枚です。");
			}
		}

		// 動かす前のリストから、動かすカードを抜く
		List<Card> fromCards = new ArrayList<>(cardRepository.findByListIdOrderByPositionAsc(fromListId));
		fromCards.removeIf(c -> c.getId().equals(id));

		// 動かした先のリストの index 番目に差し込む（大きすぎるときは一番下）
		List<Card> toCards = isOtherList
				? new ArrayList<>(cardRepository.findByListIdOrderByPositionAsc(toListId))
				: fromCards;
		toCards.add(Math.min(request.index(), toCards.size()), card);

		// 並び順を振り直す（書き換えるだけで、処理の終わりに JPA が自動で DB に保存する）
		renumber(toCards, toListId);
		if (isOtherList) {
			renumber(fromCards, fromListId);
		}
	}

	/**
	 * リストのカードを、送られてきた ID の順番に並べ替えて、DB に保存する（UC-12。並べ替えの計算は画面で行う）。
	 * 全部のカードを1つの処理（トランザクション）で書き換えるので、全部成功するか、全部取り消すかのどちらかになる。
	 * リストがなければ 404、送られてきた ID がそのリストのカードとちょうど同じでなければ 409 にする
	 * （ほかの画面で、先にカードを追加・削除・移動していたときなど）。
	 */
	@Transactional
	public void reorderCards(Long listId, CardOrderRequest request) {
		if (!taskListRepository.existsById(listId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません（id=" + listId + "）");
		}

		List<Card> cards = cardRepository.findByListIdOrderByPositionAsc(listId);
		Map<Long, Card> cardsById = cards.stream().collect(Collectors.toMap(Card::getId, card -> card));
		List<Long> ids = request.cardIds();
		boolean sameCards = ids.size() == cards.size()
				&& ids.stream().distinct().count() == ids.size()
				&& cardsById.keySet().containsAll(ids);
		if (!sameCards) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "リストのカードが変わっています。画面を読み込み直してください。");
		}

		List<Card> ordered = ids.stream().map(cardsById::get).toList();
		renumber(ordered, listId);
	}

	/** カードの並び順を、上から 0, 1, 2… に振り直す。 */
	private void renumber(List<Card> cards, Long listId) {
		for (int i = 0; i < cards.size(); i++) {
			cards.get(i).moveTo(listId, i);
		}
	}

	/** カードを1枚、DB から削除する。カードがなければ 404 にする。 */
	@Transactional
	public void deleteCard(Long id) {
		if (!cardRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません（id=" + id + "）");
		}
		cardRepository.deleteById(id);
	}

	/**
	 * 選んだカードを、まとめて DB から削除する。
	 * もう消えているカードは無視する（ほかの画面で先に消した場合など。消したい状態にはなっているため）。
	 */
	@Transactional
	public void deleteCards(CardBulkDeleteRequest request) {
		// 1回の命令（SQL）でまとめて削除する
		cardRepository.deleteAllByIdInBatch(request.cardIds());
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
