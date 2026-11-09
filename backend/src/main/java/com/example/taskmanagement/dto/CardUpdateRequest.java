package com.example.taskmanagement.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * カードを変更するときに、詳細画面から送られてくる内容（UC-03）。
 * 4つの項目を毎回すべて送る。期限なし・ラベルなしは null。
 */
public record CardUpdateRequest(
		@NotBlank @Size(max = 100) String title,
		@NotNull @Min(1) @Max(3) Integer priority,
		LocalDate dueDate,
		Long labelId) {
}
