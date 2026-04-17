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

<h1>Leaderboard</h1>

<div class="title-controls">
	<h2>Completions leaderboard ({data.difficulty} characters)</h2>
	<div class="buttons">
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
</div>

{#if data.leaderboard.length === 0}
	<p>No completions yet.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Place</th>
				<th>Player</th>
				<th>Number of completions</th>
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
{/if}

<style>
	h1, h2 {
		margin: 0 0 10px 0;
		color: var(--primary-color);
	}
	h2 { font-weight: normal; }

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 20px;
		background: var(--panel-bg);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	th, td {
		padding: 12px 10px;
		text-align: center;
	}

	th {
		background: var(--hover-bg);
		font-weight: 600;
	}

	tbody tr:hover { background: var(--hover-bg); }
	tbody td { border-bottom: 1px solid var(--bg-color); }

	.title-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.buttons {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.buttons input[type="number"] {
		width: 60px;
		text-align: center;
	}

	input[type="number"] {
		padding: 10px 14px;
		font-size: 1em;
		border-radius: 8px;
		background-color: var(--input-bg);
		border: 1px solid var(--panel-bg);
		color: var(--text-color);
		outline: none;
		width: 60px;
		text-align: center;
	}
	input[type="number"]:hover { border-color: var(--primary-color); }
	input[type="number"]:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }

	@media (max-width: 650px) {
		h1 { font-size: 1.5em; }
		h2 { font-size: 1.2em; }
		table, th, td { font-size: 0.9em; }
		th, td { padding: 8px 6px; }
	}
</style>
