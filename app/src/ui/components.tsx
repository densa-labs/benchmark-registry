import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import darkLogoUrl from "../../../assets/Benchmark-Registry-B-Logo-Dark.png";
import whiteLogoUrl from "../../../assets/Benchmark-Registry-B-Logo-White.png";
import { benchmarkDisplayName } from "../benchmark-names";
import {
  RegistryClientError,
  searchRegistry,
  type SearchResponse,
} from "../registry";
import {
  readStoredTheme,
  resolveTheme,
  storeTheme,
  SYSTEM_DARK_THEME_QUERY,
  type Theme,
} from "../theme";

export type SortDirection = "asc" | "desc";

export interface NavigationItem {
  href: string;
  label: string;
}

export interface AppShellProps {
  children: ReactNode;
  navigation: NavigationItem[];
  activeHref?: string;
}

export function AppShell({
  children,
  navigation,
  activeHref,
}: AppShellProps) {
  const { theme, selectTheme } = useThemePreference();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        navigation={navigation}
        activeHref={activeHref}
        theme={theme}
      />
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <PageContainer className="site-footer__inner">
          <p>
            © 2026{" "}
            <a className="site-footer__credit-link" href="https://densa-labs.github.io/">
              Densa Labs
            </a>
          </p>
          <ThemeToggle theme={theme} onSelectTheme={selectTheme} />
        </PageContainer>
      </footer>
    </div>
  );
}

interface HeaderProps {
  navigation: NavigationItem[];
  activeHref?: string;
  theme?: Theme;
}

export function Header({
  navigation,
  activeHref,
  theme = "light",
}: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let travel = 0;
    const handleScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      if (Math.sign(delta) !== Math.sign(travel)) travel = delta;
      else travel += delta;
      if (y <= (headerRef.current?.offsetHeight ?? 0)) setHidden(false);
      else if (travel >= 12) setHidden(true);
      else if (travel <= -12) setHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={hidden ? "site-header site-header--hidden" : "site-header"}
      ref={headerRef}
    >
      <PageContainer className="site-header__inner">
        <a className="wordmark" href="/" aria-label="Benchmark Registry home">
          <img
            className="wordmark__logo"
            src={theme === "dark" ? whiteLogoUrl : darkLogoUrl}
            alt=""
            aria-hidden="true"
          />
          <span>Benchmark Registry</span>
        </a>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activeHref === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <GlobalSearch />
      </PageContainer>
    </header>
  );
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return resolveTheme(
    readStoredTheme(window.localStorage),
    window.matchMedia(SYSTEM_DARK_THEME_QUERY).matches,
  );
}

function useThemePreference() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const systemTheme = window.matchMedia(SYSTEM_DARK_THEME_QUERY);
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme(window.localStorage) === null) {
        setTheme(event.matches ? "dark" : "light");
      }
    };

    systemTheme.addEventListener("change", handleSystemThemeChange);
    return () => systemTheme.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const selectTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    storeTheme(nextTheme, document.documentElement, window.localStorage);
  };

  return { theme, selectTheme };
}

interface ThemeToggleProps {
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
}

export function ThemeToggle({ theme, onSelectTheme }: ThemeToggleProps) {
  return (
    <fieldset className="theme-toggle">
      <legend className="visually-hidden">Color theme</legend>
      <div className="theme-toggle__options">
        <input
          className="theme-toggle__input visually-hidden"
          id="theme-light"
          name="color-theme"
          type="radio"
          value="light"
          checked={theme === "light"}
          onChange={() => onSelectTheme("light")}
        />
        <label htmlFor="theme-light">Light</label>
        <input
          className="theme-toggle__input visually-hidden"
          id="theme-dark"
          name="color-theme"
          type="radio"
          value="dark"
          checked={theme === "dark"}
          onChange={() => onSelectTheme("dark")}
        />
        <label htmlFor="theme-dark">Dark</label>
      </div>
    </fieldset>
  );
}

interface GlobalSearchProps {
  defaultValue?: string;
}

export type GlobalSearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "results"; query: string; response: SearchResponse }
  | { status: "error"; query: string; message: string };

const entityLabels: Record<SearchResponse["data"][number]["entity_type"], string> = {
  model: "Model",
  benchmark: "Benchmark",
  company: "Company",
};

export function GlobalSearchPanel({ state }: { state: Exclude<GlobalSearchState, { status: "idle" }> }) {
  if (state.status === "loading") {
    return (
      <div className="global-search-panel global-search-panel--status" id="global-search-results">
        <p aria-live="polite">Searching the registry...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="global-search-panel global-search-panel--status" id="global-search-results">
        <p role="alert">{state.message}</p>
      </div>
    );
  }

  if (state.response.data.length === 0) {
    return (
      <div className="global-search-panel global-search-panel--status" id="global-search-results">
        <p aria-live="polite">No registry entries found for “{state.query}”.</p>
      </div>
    );
  }

  return (
    <div className="global-search-panel" id="global-search-results">
      <p className="visually-hidden" aria-live="polite">
        {state.response.page.total_items} search {state.response.page.total_items === 1
          ? "result"
          : "results"} found.
      </p>
      <ul className="global-search-results">
        {state.response.data.map((result) => {
          const displayName = result.entity_type === "benchmark"
            ? benchmarkDisplayName({ name: result.canonical_name, aliases: result.aliases })
            : result.canonical_name;
          const description = displayName !== result.canonical_name
            ? result.canonical_name
            : result.matched_text !== result.canonical_name
              ? `Matched ${result.matched_text}`
              : undefined;
          return (
            <li key={`${result.entity_type}:${result.href}`}>
              <a href={result.href}>
                <span className="global-search-result__type">
                  {entityLabels[result.entity_type]}
                </span>
                <span className="global-search-result__name">
                  {displayName}
                </span>
                {description ? (
                  <span className="global-search-result__match">
                    {description}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function GlobalSearch({ defaultValue }: GlobalSearchProps) {
  const [state, setState] = useState<GlobalSearchState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const closeResults = () => {
    request.current?.abort();
    request.current = null;
    setState({ status: "idle" });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("q");
    if (!(input instanceof HTMLInputElement)) return;
    const query = input.value.trim();
    if (query.length === 0) return;

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "loading", query });
    void searchRegistry(query, fetch, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setState({ status: "results", query, response });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          query,
          message: error instanceof RegistryClientError
            ? error.message
            : "The registry search could not be completed.",
        });
      });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape" && state.status !== "idle") {
      event.preventDefault();
      closeResults();
    }
  };

  return (
    <div className="global-search-shell">
      <form
        className="global-search"
        role="search"
        aria-busy={state.status === "loading" ? "true" : undefined}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <label className="visually-hidden" htmlFor="global-search-input">
          Search the registry
        </label>
        <input
          id="global-search-input"
          name="q"
          type="search"
          maxLength={50}
          required
          defaultValue={defaultValue}
          placeholder="Search models, benchmarks, companies"
          autoComplete="off"
          aria-controls={state.status === "idle" ? undefined : "global-search-results"}
          aria-expanded={state.status !== "idle"}
          onChange={closeResults}
        />
        <button type="submit" disabled={state.status === "loading"}>Search</button>
      </form>
      {state.status === "idle" ? null : <GlobalSearchPanel state={state} />}
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={["page-container", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
}

export function PageHeader({ title, description, kicker }: PageHeaderProps) {
  return (
    <header className="page-header">
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1>{title}</h1>
      {description ? <p className="page-header__description">{description}</p> : null}
    </header>
  );
}

export interface MetadataItem {
  label: string;
  value: ReactNode;
}

export function MetadataRows({ items }: { items: MetadataItem[] }) {
  return (
    <dl className="metadata-rows">
      {items.map((item) => (
        <div className="metadata-row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface SourceLinkProps {
  href: string;
  children?: ReactNode;
}

export function SourceLink({ href, children = "Source" }: SourceLinkProps) {
  return (
    <a className="source-link" href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

interface SortableHeaderProps {
  href: string;
  label: string;
  direction?: SortDirection;
}

export function SortableHeader({ href, label, direction }: SortableHeaderProps) {
  const nextDirection = direction === "asc" ? "descending" : "ascending";

  return (
    <a
      className={[
        "sortable-header",
        direction ? "sortable-header--active" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      href={href}
      aria-label={`Sort by ${label} ${nextDirection}`}
    >
      <span>{label}</span>
      <span className="sortable-header__indicator" aria-hidden="true">
        {direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}
      </span>
    </a>
  );
}

export interface TableColumn<Row> {
  key: string;
  label: string;
  render: (row: Row) => ReactNode;
  className?: string;
  sortHref?: string;
  sortDirection?: SortDirection;
}

interface DataTableProps<Row> {
  caption: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
}: DataTableProps<Row>) {
  return (
    <div className="table-scroll" tabIndex={0} aria-label={`${caption}, scrollable`}>
      <table className="data-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.className}
                aria-sort={
                  column.sortDirection
                    ? column.sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {column.sortHref ? (
                  <SortableHeader
                    href={column.sortHref}
                    label={column.label}
                    direction={column.sortDirection}
                  />
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  getHref: (page: number) => string;
}

export function Pagination({ page, totalPages, getHref }: PaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav className="pagination" aria-label="Pagination">
      {hasPrevious ? (
        <a href={getHref(page - 1)} rel="prev">
          Previous
        </a>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <span className="pagination__status">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      {hasNext ? (
        <a href={getHref(page + 1)} rel="next">
          Next
        </a>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  );
}

interface PageSizeSelectorProps {
  value: 50 | 100 | 500;
  id?: string;
}

export function PageSizeSelector({ value, id = "page-size" }: PageSizeSelectorProps) {
  return (
    <label className="page-size" htmlFor={id}>
      <span>Rows per page</span>
      <select id={id} name="limit" defaultValue={value}>
        <option value="50">50</option>
        <option value="100">100</option>
        <option value="500">500</option>
      </select>
    </label>
  );
}

export interface TabItem {
  href: string;
  label: string;
  active?: boolean;
}

export function Tabs({ label, items }: { label: string; items: TabItem[] }) {
  return (
    <nav className="tabs" aria-label={label}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function LoadingState({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
  return (
    <div className="loading-state" role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">Loading registry results</span>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="loading-state__row" key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span className="skeleton" key={columnIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="state-message" role="status">
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="state-message__action">{action}</div> : null}
    </section>
  );
}

export function ErrorState({ title, description }: Omit<EmptyStateProps, "action">) {
  return (
    <section className="state-message state-message--error" role="alert">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function NotFoundState() {
  return (
    <section className="state-message state-message--not-found">
      <p className="state-code">404</p>
      <h2>Registry entry not found</h2>
      <p>Check the address or return to the registry index.</p>
      <div className="state-message__action">
        <a className="button-link" href="/models">
          Browse models
        </a>
      </div>
    </section>
  );
}
