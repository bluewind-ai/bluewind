<div className="navbar bg-base-100 px-0 sm:px-1">
  <div className="flex-1">
    <Link href="/" className="btn btn-ghost text-xl normal-case">
      bluewind
    </Link>
  </div>
  <div className="flex-none">
    <ul className="menu menu-horizontal flex items-center gap-2 sm:gap-4">
      {env.darkModeEnabled && (
        <li>
          <button
            className="bg-none p-0 rounded-lg flex items-center justify-center"
            onClick={toggleTheme}
          >
            <selectedTheme.icon className="w-5 h-5" />
          </button>
        </li>
      )}
      {/* <li>
                <Link
                  href="/auth/join"
                  className="btn btn-primary btn-md py-3 px-2 sm:px-4 text-white"
                >
                  {t('sign-up')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="btn btn-primary dark:border-zinc-600 dark:border-2 dark:text-zinc-200 btn-outline py-3 px-2 sm:px-4 btn-md"
                >
                  {t('sign-in')}
                </Link>
              </li> */}
    </ul>
  </div>
</div>;
