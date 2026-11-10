package com.example.taskmanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.example.taskmanagement.dto.CardMoveRequest;
import com.example.taskmanagement.dto.CardOrderRequest;
import com.example.taskmanagement.dto.ListDoneRequest;
import com.example.taskmanagement.entity.Card;
import com.example.taskmanagement.entity.TaskList;
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
	void 送られてきた順番にカードが並べ替えられる() {
		given(taskListRepository.existsById(1L)).willReturn(true);
		givenList1();

		boardService.reorderCards(1L, new CardOrderRequest(List.of(3L, 1L, 2L)));

		// C(0) A(1) B(2)
		assertThat(c.getPosition()).isEqualTo(0);
		assertThat(a.getPosition()).isEqualTo(1);
		assertThat(b.getPosition()).isEqualTo(2);
	}

	@Test
	void 並べ替えでリストのカードと違うIDだと409になる() {
		given(taskListRepository.existsById(1L)).willReturn(true);
		givenList1();

		// D はリスト2のカード
		assertThatThrownBy(() -> boardService.reorderCards(1L, new CardOrderRequest(List.of(3L, 1L, 4L))))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
		// 並び順は変わっていない
		assertThat(a.getPosition()).isEqualTo(0);
	}

	@Test
	void 並べ替えでカードが足りないと409になる() {
		given(taskListRepository.existsById(1L)).willReturn(true);
		givenList1();

		assertThatThrownBy(() -> boardService.reorderCards(1L, new CardOrderRequest(List.of(3L, 1L))))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
	}

	@Test
	void 並べ替えで同じIDが2回あると409になる() {
		given(taskListRepository.existsById(1L)).willReturn(true);
		givenList1();

		assertThatThrownBy(() -> boardService.reorderCards(1L, new CardOrderRequest(List.of(1L, 1L, 2L))))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
	}

	/** ID を指定してリストを作る */
	private static TaskList list(Long id, String name, boolean done) {
		TaskList list = new TaskList(name, 0);
		ReflectionTestUtils.setField(list, "id", id);
		list.changeDone(done);
		return list;
	}

	@Test
	void 完了用リストを指定すると前の完了用リストの指定が外れる() {
		TaskList doing = list(2L, "進行中", false);
		TaskList done = list(3L, "完了", true);
		given(taskListRepository.findById(2L)).willReturn(Optional.of(doing));
		given(taskListRepository.findByDoneTrue()).willReturn(Optional.of(done));

		boardService.setListDone(2L, new ListDoneRequest(true));

		assertThat(doing.getDone()).isTrue();
		assertThat(done.getDone()).isFalse();
		// 古い方の解除を、新しい方の指定より先に DB に書き込んでいる
		verify(taskListRepository).flush();
	}

	@Test
	void 完了用リストをもう一度指定しても完了用のまま() {
		TaskList done = list(3L, "完了", true);
		given(taskListRepository.findById(3L)).willReturn(Optional.of(done));
		given(taskListRepository.findByDoneTrue()).willReturn(Optional.of(done));

		boardService.setListDone(3L, new ListDoneRequest(true));

		assertThat(done.getDone()).isTrue();
		verify(taskListRepository, never()).flush();
	}

	@Test
	void 完了用リストを解除すると完了用リストがない状態になる() {
		TaskList done = list(3L, "完了", true);
		given(taskListRepository.findById(3L)).willReturn(Optional.of(done));

		boardService.setListDone(3L, new ListDoneRequest(false));

		assertThat(done.getDone()).isFalse();
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
