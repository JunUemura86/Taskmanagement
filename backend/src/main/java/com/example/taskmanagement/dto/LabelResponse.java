package com.example.taskmanagement.dto;

import com.example.taskmanagement.entity.Label;

/** API で返すラベル1つの形。 */
public record LabelResponse(
		Long id,
		String name,
		String colorCode,
		Integer position) {

	public static LabelResponse from(Label label) {
		return new LabelResponse(label.getId(), label.getName(), label.getColorCode(), label.getPosition());
	}
}
