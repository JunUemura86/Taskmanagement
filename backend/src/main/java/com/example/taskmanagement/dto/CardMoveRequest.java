package com.example.taskmanagement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * カードをドラッグ＆ドロップで動かすときに、画面から送られてくる内容（UC-05・UC-06）。
 *
 * @param listId 動かした先のリスト（同じリストなら並べ替え）
 * @param index  動かした先のリストで、上から何番目に入れるか（0 から数える。動かすカード自身を除いて数える）
 */
public record CardMoveRequest(
		@NotNull Long listId,
		@NotNull @Min(0) Integer index) {
}
