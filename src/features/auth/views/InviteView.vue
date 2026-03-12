<template>
  <main class="auth-page">
    <article>
      <header>
        <div class="brand-mark">Q</div>
        <h2>Accept Invitation</h2>
      </header>
      <p>Invite acceptance form — coming in P0.</p>
    </article>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.auth-page article {
  width: 100%;
  max-width: 400px;
}

.auth-page header {
  text-align: center;
}

.brand-mark {
  width: 48px;
  height: 48px;
  background: var(--color-teal, #2a9d8f);
  color: #fff;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
</style>
