package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Card;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** カード表を読み書きする窓口。 */
public interface CardRepository extends JpaRepository<Card, Long> {

	/** すべてのカードを、並び順（上から）で取り出す。 */
	List<Card> findAllByOrderByPositionAsc();
}
