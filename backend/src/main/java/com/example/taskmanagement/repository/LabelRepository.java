package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Label;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** ラベル表を読み書きする窓口。 */
public interface LabelRepository extends JpaRepository<Label, Long> {

	/** すべてのラベルを、並び順（左から）で取り出す。 */
	List<Label> findAllByOrderByPositionAsc();
}
