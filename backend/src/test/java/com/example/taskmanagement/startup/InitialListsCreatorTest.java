package com.example.taskmanagement.startup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.example.taskmanagement.entity.TaskList;
import com.example.taskmanagement.repository.TaskListRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** 初期リストの作成を確かめる（DB は使わず、リポジトリは偽物にする）。 */
@ExtendWith(MockitoExtension.class)
class InitialListsCreatorTest {

	@Mock
	private TaskListRepository taskListRepository;

	@InjectMocks
	private InitialListsCreator creator;

	@Test
	void リストが1つもなければ未着手と進行中と完了を作り完了を完了用にする() {
		given(taskListRepository.count()).willReturn(0L);

		creator.run(null);

		ArgumentCaptor<TaskList> saved = ArgumentCaptor.forClass(TaskList.class);
		verify(taskListRepository, times(3)).save(saved.capture());
		List<TaskList> lists = saved.getAllValues();
		assertThat(lists).extracting(TaskList::getName).containsExactly("未着手", "進行中", "完了");
		assertThat(lists).extracting(TaskList::getPosition).containsExactly(0, 1, 2);
		assertThat(lists).extracting(TaskList::getDone).containsExactly(false, false, true);
	}

	@Test
	void リストが1つでもあれば何も作らない() {
		given(taskListRepository.count()).willReturn(1L);

		creator.run(null);

		verify(taskListRepository, never()).save(any());
	}
}
