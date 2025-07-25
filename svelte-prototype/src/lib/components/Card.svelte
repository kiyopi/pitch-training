<script lang="ts">
  export let variant = 'default';
  export let padding = 'md';
  export let interactive = false;
</script>

<div 
  class="card"
  class:card-default={variant === 'default'}
  class:card-primary={variant === 'primary'}
  class:card-success={variant === 'success'}
  class:card-warning={variant === 'warning'}
  class:card-sm={padding === 'sm'}
  class:card-md={padding === 'md'}
  class:card-lg={padding === 'lg'}
  class:card-interactive={interactive}
>
  <slot />
</div>

<style>
  .card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-gray-200);
    border-radius: 12px;
    transition: all 0.2s ease;
  }
  
  .card-interactive:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .card-primary {
    border-color: var(--color-primary-light);
    background: linear-gradient(135deg, var(--color-primary-pale) 0%, var(--color-bg-primary) 100%);
  }
  
  .card-success {
    border-color: var(--color-success);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, var(--color-bg-primary) 100%);
  }
  
  .card-warning {
    border-color: var(--color-warning);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--color-bg-primary) 100%);
  }
  
  .card-sm { padding: var(--space-4); }
  .card-md { padding: var(--space-6); }
  .card-lg { padding: var(--space-8); }
</style>