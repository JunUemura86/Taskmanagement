package com.example.taskmanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * リストのカードを、条件で並べ替えたあとの順番（UC-12）。上から順に、カードの ID を並べる。
 * そのリストのカードを、ちょうど全部（1リストに最大100枚）含めて送る。
 */
public record CardOrderRequest(
		@NotNull @Size(max = 100) List<@NotNull Long> cardIds) {
}
