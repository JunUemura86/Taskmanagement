package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Card;
import java.time.LocalDate;

/** API で返すカード1枚の形。 */
public record CardResponse(
		Long id,
		Long listId,
		Long labelId,
		String title,
		Integer priority,
		LocalDate dueDate,
		Integer position) {

	public static CardResponse from(Card card) {
		return new CardResponse(card.getId(), card.getListId(), card.getLabelId(), card.getTitle(),
				card.getPriority(), card.getDueDate(), card.getPosition());
	}
}
