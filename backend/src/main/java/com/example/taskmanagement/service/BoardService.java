package com.example.taskmanagement.service;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.LabelResponse;
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

/** ボード・カード・ラベルを読み取る処理をまとめたクラス。 */
@Service
@Transactional(readOnly = true)
public class BoardService {

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

	/** すべてのラベルを、並び順どおりに返す。 */
	public List<LabelResponse> getLabels() {
		return labelRepository.findAllByOrderByPositionAsc().stream()
				.map(LabelResponse::from)
				.toList();
	}
}
