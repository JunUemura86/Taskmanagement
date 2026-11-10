package com.example.taskmanagement.startup;

import com.example.taskmanagement.entity.TaskList;
import com.example.taskmanagement.repository.TaskListRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 初期リストの作成（F-02 / UC-01）。
 * サーバーを起動したとき、リストが1つもなければ「未着手」「進行中」「完了」を作る。「完了」は完了用リストにする（機能要件 2.4）。
 * カードは作らない。リストが1つでもあれば、何もしない
 * （開発用の設定（dev）では、先にテストデータ（db/testdata）が入るので、何もしない）。
 */
@Component
public class InitialListsCreator implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(InitialListsCreator.class);

	private final TaskListRepository taskListRepository;

	public InitialListsCreator(TaskListRepository taskListRepository) {
		this.taskListRepository = taskListRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (taskListRepository.count() > 0) {
			return;
		}

		TaskList done = new TaskList("完了", 2);
		done.changeDone(true);
		taskListRepository.save(new TaskList("未着手", 0));
		taskListRepository.save(new TaskList("進行中", 1));
		taskListRepository.save(done);
		log.info("リストが1つもないため、初期リスト（未着手・進行中・完了）を作りました。");
	}
}
