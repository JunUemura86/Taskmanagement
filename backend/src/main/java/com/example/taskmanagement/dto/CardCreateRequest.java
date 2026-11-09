package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** カードを追加するときに、画面から送られてくる内容。登録時はタイトルだけを入力する（UC-02）。 */
public record CardCreateRequest(
		@NotNull Long listId,
		@NotBlank @Size(max = 100) String title) {
}
