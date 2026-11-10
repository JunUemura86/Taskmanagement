package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 選んだカードをまとめて削除するときに、画面から送られてくる内容（UC-10）。
 * 1回で送れるのは、ボードに入るカードの最大枚数（リスト10個 × 100枚）まで。
 */
public record CardBulkDeleteRequest(
		@NotEmpty @Size(max = 1000) List<@NotNull Long> cardIds) {
}
