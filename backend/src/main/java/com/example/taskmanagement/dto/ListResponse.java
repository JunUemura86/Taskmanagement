package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.TaskList;

/** API で返すリスト1つの形（中のカードは含まない）。 */
public record ListResponse(
		Long id,
		String name,
		Integer position,
		Boolean isDone) {

	public static ListResponse from(TaskList list) {
		return new ListResponse(list.getId(), list.getName(), list.getPosition(), list.getDone());
	}
}
