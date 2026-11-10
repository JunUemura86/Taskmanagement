package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 完了用リストを指定・解除するときに、画面から送られてくる内容（UC-11）。
 *
 * @param isDone true なら完了用リストにする、false なら解除する
 */
public record ListDoneRequest(
		@NotNull Boolean isDone) {
}
