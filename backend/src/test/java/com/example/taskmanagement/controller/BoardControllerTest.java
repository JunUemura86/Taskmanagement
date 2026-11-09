package com.example.taskmanagement.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.taskmanagement.dto.BoardListResponse;
import com.example.taskmanagement.dto.CardCreateRequest;
import com.example.taskmanagement.dto.CardResponse;
import com.example.taskmanagement.dto.LabelResponse;
import com.example.taskmanagement.dto.ListCreateRequest;
import com.example.taskmanagement.service.BoardService;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

/** API が正しい形の JSON を返すかを確かめる（DB は使わず、BoardService は偽物にする）。 */
@WebMvcTest(BoardController.class)
class BoardControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private BoardService boardService;

	private final CardResponse card = new CardResponse(1L, 10L, 2L, "買い物に行く", 1, LocalDate.of(2026, 11, 10), 0);

	@Test
	void ボードを取得するとリストとカードが返る() throws Exception {
		given(boardService.getBoard()).willReturn(List.of(
				new BoardListResponse(10L, "未着手", 0, false, List.of(card)),
				new BoardListResponse(11L, "完了", 1, true, List.of())));

		mockMvc.perform(get("/api/board"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].name").value("未着手"))
				.andExpect(jsonPath("$[0].isDone").value(false))
				.andExpect(jsonPath("$[0].cards[0].title").value("買い物に行く"))
				.andExpect(jsonPath("$[0].cards[0].dueDate").value("2026-11-10"))
				.andExpect(jsonPath("$[1].isDone").value(true))
				.andExpect(jsonPath("$[1].cards.length()").value(0));
	}

	@Test
	void カードを1枚取得できる() throws Exception {
		given(boardService.getCard(1L)).willReturn(card);

		mockMvc.perform(get("/api/cards/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(1))
				.andExpect(jsonPath("$.listId").value(10))
				.andExpect(jsonPath("$.priority").value(1));
	}

	@Test
	void ないカードを取得すると404になる() throws Exception {
		given(boardService.getCard(999L)).willThrow(new ResponseStatusException(HttpStatus.NOT_FOUND));

		mockMvc.perform(get("/api/cards/999"))
				.andExpect(status().isNotFound());
	}

	@Test
	void ラベルの一覧を取得できる() throws Exception {
		given(boardService.getLabels()).willReturn(List.of(new LabelResponse(1L, "赤", "#E5484D", 0)));

		mockMvc.perform(get("/api/labels"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("赤"))
				.andExpect(jsonPath("$[0].colorCode").value("#E5484D"));
	}

	@Test
	void リストを追加すると201と作ったリストが返る() throws Exception {
		given(boardService.createList(new ListCreateRequest("確認待ち")))
				.willReturn(new BoardListResponse(12L, "確認待ち", 3, false, List.of()));

		mockMvc.perform(post("/api/lists")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"確認待ち\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(12))
				.andExpect(jsonPath("$.name").value("確認待ち"))
				.andExpect(jsonPath("$.position").value(3))
				.andExpect(jsonPath("$.isDone").value(false))
				.andExpect(jsonPath("$.cards.length()").value(0));
	}

	@Test
	void リスト名が空だと400になる() throws Exception {
		mockMvc.perform(post("/api/lists")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"\"}"))
				.andExpect(status().isBadRequest());

		verify(boardService, never()).createList(any());
	}

	@Test
	void リスト名が31文字だと400になる() throws Exception {
		String name = "あ".repeat(31);

		mockMvc.perform(post("/api/lists")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"" + name + "\"}"))
				.andExpect(status().isBadRequest());

		verify(boardService, never()).createList(any());
	}

	@Test
	void カードを追加すると201と作ったカードが返る() throws Exception {
		given(boardService.createCard(new CardCreateRequest(10L, "メールを送る")))
				.willReturn(new CardResponse(7L, 10L, null, "メールを送る", 2, null, 3));

		mockMvc.perform(post("/api/cards")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"listId\":10,\"title\":\"メールを送る\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(7))
				.andExpect(jsonPath("$.listId").value(10))
				.andExpect(jsonPath("$.title").value("メールを送る"))
				.andExpect(jsonPath("$.priority").value(2))
				.andExpect(jsonPath("$.position").value(3));
	}

	@Test
	void タイトルが空だと400になる() throws Exception {
		mockMvc.perform(post("/api/cards")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"listId\":10,\"title\":\"\"}"))
				.andExpect(status().isBadRequest());

		verify(boardService, never()).createCard(any());
	}

	@Test
	void タイトルが101文字だと400になる() throws Exception {
		String title = "あ".repeat(101);

		mockMvc.perform(post("/api/cards")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"listId\":10,\"title\":\"" + title + "\"}"))
				.andExpect(status().isBadRequest());

		verify(boardService, never()).createCard(any());
	}

	@Test
	void リストIDがないと400になる() throws Exception {
		mockMvc.perform(post("/api/cards")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"メールを送る\"}"))
				.andExpect(status().isBadRequest());

		verify(boardService, never()).createCard(any());
	}
}
