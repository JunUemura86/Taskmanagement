package com.example.taskmanagement.repository;

import com.example.taskmanagement.entity.Card;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** カード表を読み書きする窓口。 */
public interface CardRepository extends JpaRepository<Card, Long> {

	/** すべてのカードを、並び順（上から）で取り出す。 */
	List<Card> findAllByOrderByPositionAsc();

	/** そのリストのカードを、並び順（上から）で取り出す。 */
	List<Card> findByListIdOrderByPositionAsc(Long listId);

	/** そのリストにあるカードの枚数を数える。 */
	long countByListId(Long listId);

	/** そのリストで一番下（position が一番大きい）のカードを取り出す。カードがなければ空。 */
	Optional<Card> findTopByListIdOrderByPositionDesc(Long listId);
}
