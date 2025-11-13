const GitHubLoader = {
  init: async function (limit = 6) {
    const container = document.getElementById('github-projects');
    if (!container) {
      return;
    }

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
      container.innerHTML = `<p style="color: #ff6b6b;">Failed to load projects</p>`;
    }
  },

  /**
   * @param {Array} repos
   * @param {HTMLElement} container
   */
  renderProjects: function (repos, container) {
    container.innerHTML = '';

    repos.forEach((repo) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <h3>${this.escapeHtml(repo.name)}</h3>
        <p>${repo.language ? this.escapeHtml(repo.language) : 'Unknown Language'}</p>
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
    GitHubLoader.init('g3nn3sis', 'github-projects', 6);
  }
});
