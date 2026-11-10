package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** リスト名を変更するときに、画面から送られてくる内容（UC-08）。 */
public record ListRenameRequest(
		@NotBlank @Size(max = 30) String name) {
}
