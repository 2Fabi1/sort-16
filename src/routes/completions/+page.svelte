<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	function navigate(diff: number) {
		let target = diff;
		if (target < 8) target = 36;
		if (target > 36) target = 8;
		goto(`/completions?difficulty=${target}`);
	}

	function handleInput(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value);
		if (!isNaN(val) && val >= 8 && val <= 36) {
			goto(`/completions?difficulty=${val}`);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleInput(e);
		}
	}
</script>

<div class="completions-page">
	<h1 class="title">Leaderboard</h1>
	<p class="subtitle">Completions ({data.difficulty} characters)</p>

	<div class="nav-controls">
		<button onclick={() => navigate(data.difficulty - 1)}>&lt;</button>
		<input
			type="number"
			min="8"
			max="36"
			value={data.difficulty}
			oninput={handleInput}
			onkeydown={handleKeydown}
		/>
		<button onclick={() => navigate(data.difficulty + 1)}>&gt;</button>
	</div>

	{#if data.leaderboard.length === 0}
		<p class="empty-state">No completions yet.</p>
	{:else}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Place</th>
						<th>Player</th>
						<th>Completions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaderboard as entry, i}
						<tr>
							<td>{i + 1}</td>
							<td>{entry.username}</td>
							<td>{entry.count}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.completions-page {
		max-width: 700px;
		margin: 2rem auto;
		padding: 0 1rem;
		text-align: center;
	}

	.title {
		color: var(--primary-color);
		margin-bottom: 0.25rem;
	}

	.subtitle {
		color: var(--text-color);
		opacity: 0.8;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.nav-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.nav-controls button {
		width: 40px;
		height: 40px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2em;
		border-radius: 8px;
	}

	.nav-controls input {
		width: 70px;
		height: 40px;
		text-align: center;
		font-size: 1em;
		border-radius: 8px;
		border: 1px solid #ccc;
		outline: none;
		background: var(--panel-bg);
		color: var(--text-color);
	}

	.nav-controls input:focus {
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
	}

	.empty-state {
		color: var(--text-color);
		opacity: 0.6;
		font-style: italic;
		margin-top: 2rem;
	}

	.table-wrapper {
		background: var(--panel-bg);
		border-radius: 12px;
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: center;
	}

	th {
		padding: 12px 16px;
		font-weight: 600;
		border-bottom: 2px solid var(--hover-bg);
	}

	td {
		padding: 10px 16px;
	}

	tbody tr:hover {
		background: var(--hover-bg);
	}
</style>
