package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.TaskList;
import java.util.List;

/** ボードの API で返すリスト1つの形。中のカードも一緒に持つ。 */
public record BoardListResponse(
		Long id,
		String name,
		Integer position,
		Boolean isDone,
		List<CardResponse> cards) {

	public static BoardListResponse from(TaskList list, List<CardResponse> cards) {
		return new BoardListResponse(list.getId(), list.getName(), list.getPosition(), list.getDone(), cards);
	}
}
