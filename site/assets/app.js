const GitHubLoader = {
  init: async function (limit = 6) {
    const container = document.getElementById('github-projects');
    if (!container) {
      return;
    }

    container.innerHTML = '<p class="project-card">Loading projects…</p>';

    try {
      const response = await fetch(
        `https://api.github.com/users/g3nn3sis/repos?sort=updated&per_page=${limit}`
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      this.renderProjects(repos, container);
    } catch (error) {
      console.error('Error fetching GitHub projects:', error);
      container.innerHTML = '<p class="project-card">Projects are temporarily unavailable.</p>';
    }
  },

  /**
   * @param {Array} repos
   * @param {HTMLElement} container
   */
  renderProjects: function (repos, container) {
    container.innerHTML = '';

    const visibleRepos = repos.filter((repo) => !repo.fork).slice(0, 6);

    if (!visibleRepos.length) {
      container.innerHTML = '<p class="project-card">No projects to show right now.</p>';
      return;
    }

    visibleRepos.forEach((repo) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <h3>${this.escapeHtml(repo.name)}</h3>
        <p>${this.escapeHtml(repo.description || 'A small project with a curious purpose.')}</p>
        <div class="meta">
          <span>${this.escapeHtml(repo.language || 'Misc')}</span>
          <span>${repo.stargazers_count > 0 ? `${repo.stargazers_count}★` : 'fresh'}</span>
        </div>
        <a href="${this.escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">View on GitHub →</a>
      `;
      container.appendChild(card);
    });
  },

  /**
   * @param {string} text
   * @returns {string}
   */
  escapeHtml: function (text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('github-projects')) {
    GitHubLoader.init(6);
  }
});
