export default function NotFound() {
    return `
        <main class="not-found">

            <div class="not-found-code">
                404
            </div>

            <div class="not-found-content">

                <div class="eyebrow">
                    ROUTE NOT FOUND
                </div>

                <h1>
                    This page doesn't exist.
                </h1>

                <p>
                    The requested route could not be found.
                    It may have been moved or doesn't exist.
                </p>

                <div class="not-found-actions">

                    <a
                        href="/"
                        class="not-found-button"
                    >
                        Back to dashboard
                    </a>

                    <button
                        type="button"
                        class="not-found-secondary"
                        onclick="history.back()"
                    >
                        Go back
                    </button>

                </div>

            </div>

        </main>
    `;
}