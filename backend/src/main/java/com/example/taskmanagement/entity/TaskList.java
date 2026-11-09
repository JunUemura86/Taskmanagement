package com.example.taskmanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/** リスト表（lists）の1行。Java の List と名前がかぶらないように TaskList にしている。 */
@Entity
@Table(name = "lists")
public class TaskList {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 30)
	private String name;

	@Column(nullable = false)
	private Integer position;

	@Column(name = "is_done", nullable = false)
	private Boolean done;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private OffsetDateTime createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false)
	private OffsetDateTime updatedAt;

	protected TaskList() {
	}

	/** 新しいリストを作る。完了用リストにはしない（あとで「…」メニューから指定する）。 */
	public TaskList(String name, Integer position) {
		this.name = name;
		this.position = position;
		this.done = false;
	}

	public Long getId() { return id; }
	public String getName() { return name; }
	public Integer getPosition() { return position; }
	public Boolean getDone() { return done; }
	public OffsetDateTime getCreatedAt() { return createdAt; }
	public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
