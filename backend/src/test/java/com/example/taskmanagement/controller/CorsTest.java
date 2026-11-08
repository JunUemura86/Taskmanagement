package com.example.taskmanagement.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.taskmanagement.config.WebConfig;
import com.example.taskmanagement.service.BoardService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** 画面（localhost:5173）からだけ API を呼べるか（CORS の設定）を確かめる。 */
@WebMvcTest(BoardController.class)
@Import(WebConfig.class)
class CorsTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private BoardService boardService;

	@Test
	void 画面のlocalhost5173からは呼び出せる() throws Exception {
		given(boardService.getBoard()).willReturn(List.of());

		mockMvc.perform(get("/api/board").header("Origin", "http://localhost:5173"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
	}

	@Test
	void 画面の127_0_0_1の5173からも呼び出せる() throws Exception {
		given(boardService.getBoard()).willReturn(List.of());

		mockMvc.perform(get("/api/board").header("Origin", "http://127.0.0.1:5173"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5173"));
	}

	@Test
	void 許可していない場所からは呼び出せない() throws Exception {
		mockMvc.perform(get("/api/board").header("Origin", "http://example.com"))
				.andExpect(status().isForbidden())
				.andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
	}

	@Test
	void 別のポートの画面からは呼び出せない() throws Exception {
		mockMvc.perform(get("/api/board").header("Origin", "http://localhost:5174"))
				.andExpect(status().isForbidden());
	}

	@Test
	void 削除などの事前確認にも許可を返す() throws Exception {
		// 変更・削除の呼び出しの前に、ブラウザは OPTIONS で「呼んでいいか」を確認する（プリフライト）
		mockMvc.perform(options("/api/board")
				.header("Origin", "http://localhost:5173")
				.header("Access-Control-Request-Method", "DELETE"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
				.andExpect(header().string("Access-Control-Allow-Methods", containsString("DELETE")));
	}
}
