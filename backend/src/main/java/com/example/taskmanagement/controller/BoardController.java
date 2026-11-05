package com.example.taskmanagement.controller;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.service.BoardService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 読み取りの API（URL）を受け付けるクラス。 */
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

	/** GET /api/labels：ラベルの一覧を返す。 */
	@GetMapping("/labels")
	public List<LabelResponse> getLabels() {
		return boardService.getLabels();
	}
}
