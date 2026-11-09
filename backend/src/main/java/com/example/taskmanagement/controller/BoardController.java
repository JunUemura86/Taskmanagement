package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardMoveRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.CardUpdateRequest;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.dto.ListCreateRequest;
import com.example.taskmanagement.service.BoardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** ボード・カード・ラベルの API（URL）を受け付けるクラス。 */
@RestController
@RequestMapping("/api")
public class BoardController {

	private final BoardService boardService;

	public BoardController(BoardService boardService) {
		this.boardService = boardService;
	}

	/** GET /api/board：リストと、その中のカードをまとめて返す。 */
	@GetMapping("/board")
	public List<BoardListResponse> getBoard() {
		return boardService.getBoard();
	}

	/** GET /api/cards/{id}：カードを1枚返す。 */
	@GetMapping("/cards/{id}")
	public CardResponse getCard(@PathVariable Long id) {
		return boardService.getCard(id);
	}

	/** POST /api/lists：リストを一番右に追加し、作ったリスト（カードは空）を返す（201 Created）。 */
	@PostMapping("/lists")
	@ResponseStatus(HttpStatus.CREATED)
	public BoardListResponse createList(@Valid @RequestBody ListCreateRequest request) {
		return boardService.createList(request);
	}

	/** POST /api/cards：カードをリストの一番下に追加し、作ったカードを返す（201 Created）。 */
	@PostMapping("/cards")
	@ResponseStatus(HttpStatus.CREATED)
	public CardResponse createCard(@Valid @RequestBody CardCreateRequest request) {
		return boardService.createCard(request);
	}

	/** PUT /api/cards/{id}：カードのタイトル・優先度・期限・ラベルを変更し、変更したあとのカードを返す。 */
	@PutMapping("/cards/{id}")
	public CardResponse updateCard(@PathVariable Long id, @Valid @RequestBody CardUpdateRequest request) {
		return boardService.updateCard(id, request);
	}

	/** PATCH /api/cards/{id}/position：カードを別のリスト・別の位置に動かす。返す中身はない（204 No Content）。 */
	@PatchMapping("/cards/{id}/position")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void moveCard(@PathVariable Long id, @Valid @RequestBody CardMoveRequest request) {
		boardService.moveCard(id, request);
	}

	/** DELETE /api/cards/{id}：カードを1枚削除する。返す中身はない（204 No Content）。 */
	@DeleteMapping("/cards/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteCard(@PathVariable Long id) {
		boardService.deleteCard(id);
	}

	/** GET /api/labels：ラベルの一覧を返す。 */
	@GetMapping("/labels")
	public List<LabelResponse> getLabels() {
		return boardService.getLabels();
	}
}
