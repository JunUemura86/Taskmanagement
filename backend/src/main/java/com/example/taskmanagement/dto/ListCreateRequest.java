package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** リストを追加するときに、画面から送られてくる内容。リスト名だけを入力する（UC-07）。 */
public record ListCreateRequest(
		@NotBlank @Size(max = 30) String name) {
}
