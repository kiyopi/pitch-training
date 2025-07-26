<script>
  export let variant = 'primary';
  export let size = 'md';
  export let disabled = false;
  export let fullWidth = false;
  export let href = undefined;
  
  let className = '';
  export { className as class };
</script>

{#if href}
  <a 
    {href}
    data-sveltekit-preload-data="hover"
    class="btn {className}"
    class:btn-primary={variant === 'primary'}
    class:btn-secondary={variant === 'secondary'}
    class:btn-ghost={variant === 'ghost'}
    class:btn-success={variant === 'success'}
    class:btn-warning={variant === 'warning'}
    class:btn-tertiary={variant === 'tertiary'}
    class:btn-disabled-variant={variant === 'disabled'}
    class:btn-sm={size === 'sm'}
    class:btn-md={size === 'md'}
    class:btn-lg={size === 'lg'}
    class:btn-disabled={disabled}
    class:btn-full={fullWidth}
  >
    <slot />
  </a>
{:else}
  <button 
    type="button"
    {disabled}
    class="btn {className}"
    class:btn-primary={variant === 'primary'}
    class:btn-secondary={variant === 'secondary'}
    class:btn-ghost={variant === 'ghost'}
    class:btn-success={variant === 'success'}
    class:btn-warning={variant === 'warning'}
    class:btn-tertiary={variant === 'tertiary'}
    class:btn-disabled-variant={variant === 'disabled'}
    class:btn-sm={size === 'sm'}
    class:btn-md={size === 'md'}
    class:btn-lg={size === 'lg'}
    class:btn-disabled={disabled}
    class:btn-full={fullWidth}
    on:click
  >
    <slot />
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    font-family: inherit;
  }
  
  .btn:disabled,
  .btn-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-full {
    width: 100%;
  }
  
  /* Variants */
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-secondary {
    background: var(--color-gray-100);
    color: var(--color-gray-700);
    border: 1px solid var(--color-gray-200);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-gray-200);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-primary);
  }
  
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-primary-pale);
  }
  
  .btn-success {
    background: #059669;
    color: white;
  }
  
  .btn-success:hover:not(:disabled) {
    background: #047857;
  }
  
  .btn-warning {
    background: #ea580c;
    color: white;
  }
  
  .btn-warning:hover:not(:disabled) {
    background: #dc2626;
  }
  
  .btn-tertiary {
    background: #9333ea;
    color: white;
  }
  
  .btn-tertiary:hover:not(:disabled) {
    background: #7c3aed;
  }
  
  .btn-disabled-variant {
    background: #9ca3af;
    color: white;
    cursor: not-allowed;
  }
  
  /* Sizes */
  .btn-sm {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
  }
  
  .btn-md {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-base);
  }
  
  .btn-lg {
    padding: var(--space-4) var(--space-6);
    font-size: var(--text-lg);
  }
</style>