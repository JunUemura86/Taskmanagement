package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.TaskList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** リスト表を読み書きする窓口。メソッド名から SQL が自動で作られる。 */
public interface TaskListRepository extends JpaRepository<TaskList, Long> {

	/** すべてのリストを、並び順（左から）で取り出す。 */
	List<TaskList> findAllByOrderByPositionAsc();

	/** 一番右（position が一番大きい）のリストを取り出す。リストがなければ空。 */
	Optional<TaskList> findTopByOrderByPositionDesc();
}
