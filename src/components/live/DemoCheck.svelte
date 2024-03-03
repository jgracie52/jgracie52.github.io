<script>
    import { onMount } from "svelte";
    let innerWidth = 0;

    onMount(() => {
        innerWidth = window.innerWidth;

        window.addEventListener("resize", () => {
            innerWidth = window.innerWidth;
        });
    });
</script>

{#if innerWidth > 768 }
<slot/>
{:else}
<p>Sorry, this is best viewed on larger screens</p>
{/if}