package com.example.taskmanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/** カード表（cards）の1行。リストIDとラベルIDは、数字のまま持つ。 */
@Entity
@Table(name = "cards")
public class Card {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "list_id", nullable = false)
	private Long listId;

	@Column(name = "label_id")
	private Long labelId;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(nullable = false)
	private Integer priority;

	@Column(name = "due_date")
	private LocalDate dueDate;

	@Column(nullable = false)
	private Integer position;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false)
	private OffsetDateTime updatedAt;

	protected Card() {
	}

	public Long getId() { return id; }
	public Long getListId() { return listId; }
	public Long getLabelId() { return labelId; }
	public String getTitle() { return title; }
	public Integer getPriority() { return priority; }
	public LocalDate getDueDate() { return dueDate; }
	public Integer getPosition() { return position; }
	public OffsetDateTime getCreatedAt() { return createdAt; }
	public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
