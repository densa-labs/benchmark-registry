import type { FormEvent, ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export interface NavigationItem {
  href: string;
  label: string;
}

export interface AppShellProps {
  children: ReactNode;
  navigation: NavigationItem[];
  activeHref?: string;
  onSearchSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

export function AppShell({
  children,
  navigation,
  activeHref,
  onSearchSubmit,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        navigation={navigation}
        activeHref={activeHref}
        onSearchSubmit={onSearchSubmit}
      />
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <PageContainer>
          <p>Benchmark Registry</p>
        </PageContainer>
      </footer>
    </div>
  );
}

interface HeaderProps {
  navigation: NavigationItem[];
  activeHref?: string;
  onSearchSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

export function Header({ navigation, activeHref, onSearchSubmit }: HeaderProps) {
  return (
    <header className="site-header">
      <PageContainer className="site-header__inner">
        <a className="wordmark" href="/" aria-label="Benchmark Registry home">
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
        <GlobalSearch onSubmit={onSearchSubmit} />
      </PageContainer>
    </header>
  );
}

interface GlobalSearchProps {
  defaultValue?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

export function GlobalSearch({ defaultValue, onSubmit }: GlobalSearchProps) {
  return (
    <form className="global-search" role="search" onSubmit={onSubmit}>
      <label className="visually-hidden" htmlFor="global-search-input">
        Search the registry
      </label>
      <input
        id="global-search-input"
        name="q"
        type="search"
        maxLength={50}
        defaultValue={defaultValue}
        placeholder="Search models, benchmarks, companies"
        autoComplete="off"
      />
      <button type="submit">Search</button>
    </form>
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
      className="sortable-header"
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
