package com.example.taskmanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.example.taskmanagement.dto.CardMoveRequest;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.repository.CardRepository;
import com.example.taskmanagement.repository.LabelRepository;
import com.example.taskmanagement.repository.TaskListRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

/** カードを動かしたときの、並び順の振り直しを確かめる（DB は使わず、リポジトリは偽物にする）。 */
@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

	@Mock
	private TaskListRepository taskListRepository;

	@Mock
	private CardRepository cardRepository;

	@Mock
	private LabelRepository labelRepository;

	private BoardService boardService;

	// リスト1：A(0) B(1) C(2)、リスト2：D(0) E(1)
	private Card a;
	private Card b;
	private Card c;
	private Card d;
	private Card e;

	@BeforeEach
	void setUp() {
		boardService = new BoardService(taskListRepository, cardRepository, labelRepository);
		a = card(1L, 1L, "A", 0);
		b = card(2L, 1L, "B", 1);
		c = card(3L, 1L, "C", 2);
		d = card(4L, 2L, "D", 0);
		e = card(5L, 2L, "E", 1);
	}

	/** ID を指定してカードを作る（ID はふつう DB が決めるので、テストでは直接入れる）。 */
	private static Card card(Long id, Long listId, String title, int position) {
		Card card = new Card(listId, title, position);
		ReflectionTestUtils.setField(card, "id", id);
		return card;
	}

	private void givenList1() {
		given(cardRepository.findByListIdOrderByPositionAsc(1L)).willReturn(List.of(a, b, c));
	}

	private void givenList2() {
		given(cardRepository.findByListIdOrderByPositionAsc(2L)).willReturn(List.of(d, e));
	}

	@Test
	void 同じリストで一番上のカードを一番下へ動かせる() {
		given(cardRepository.findById(1L)).willReturn(Optional.of(a));
		givenList1();

		boardService.moveCard(1L, new CardMoveRequest(1L, 2));

		// B(0) C(1) A(2)
		assertThat(b.getPosition()).isEqualTo(0);
		assertThat(c.getPosition()).isEqualTo(1);
		assertThat(a.getPosition()).isEqualTo(2);
	}

	@Test
	void 同じリストで一番下のカードを一番上へ動かせる() {
		given(cardRepository.findById(3L)).willReturn(Optional.of(c));
		givenList1();

		boardService.moveCard(3L, new CardMoveRequest(1L, 0));

		// C(0) A(1) B(2)
		assertThat(c.getPosition()).isEqualTo(0);
		assertThat(a.getPosition()).isEqualTo(1);
		assertThat(b.getPosition()).isEqualTo(2);
	}

	@Test
	void 別のリストへ動かすと両方のリストの並び順が振り直される() {
		given(cardRepository.findById(2L)).willReturn(Optional.of(b));
		given(taskListRepository.existsById(2L)).willReturn(true);
		given(cardRepository.countByListId(2L)).willReturn(2L);
		givenList1();
		givenList2();

		boardService.moveCard(2L, new CardMoveRequest(2L, 1));

		// リスト1：A(0) C(1)
		assertThat(a.getPosition()).isEqualTo(0);
		assertThat(c.getPosition()).isEqualTo(1);
		// リスト2：D(0) B(1) E(2)
		assertThat(b.getListId()).isEqualTo(2L);
		assertThat(d.getPosition()).isEqualTo(0);
		assertThat(b.getPosition()).isEqualTo(1);
		assertThat(e.getPosition()).isEqualTo(2);
	}

	@Test
	void 位置が大きすぎるときは一番下に入る() {
		given(cardRepository.findById(1L)).willReturn(Optional.of(a));
		given(taskListRepository.existsById(2L)).willReturn(true);
		given(cardRepository.countByListId(2L)).willReturn(2L);
		givenList1();
		givenList2();

		boardService.moveCard(1L, new CardMoveRequest(2L, 99));

		// リスト2：D(0) E(1) A(2)
		assertThat(a.getListId()).isEqualTo(2L);
		assertThat(a.getPosition()).isEqualTo(2);
	}

	@Test
	void 動かした先のリストに100枚あると409になる() {
		given(cardRepository.findById(1L)).willReturn(Optional.of(a));
		given(taskListRepository.existsById(2L)).willReturn(true);
		given(cardRepository.countByListId(2L)).willReturn(100L);

		assertThatThrownBy(() -> boardService.moveCard(1L, new CardMoveRequest(2L, 0)))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
		// 動かしていない
		assertThat(a.getListId()).isEqualTo(1L);
		assertThat(a.getPosition()).isEqualTo(0);
	}

	@Test
	void ないリストへ動かすと404になる() {
		given(cardRepository.findById(1L)).willReturn(Optional.of(a));
		given(taskListRepository.existsById(99L)).willReturn(false);

		assertThatThrownBy(() -> boardService.moveCard(1L, new CardMoveRequest(99L, 0)))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
	}
}
