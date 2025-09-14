import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RisksList from "./RisksList";

vi.mock("../services/risks", async () => {
  return {
    listRisks: vi.fn().mockResolvedValue([]),
    getRiskOwners: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("../services/rbs", async () => {
  return {
    listRBSTree: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("../hooks/usePermissions", async () => {
  return {
    usePermissions: () => ({
      canCreateRisks: () => false,
      canEditRisks: () => true,
    }),
  };
});

const { listRisks } = await import("../services/risks");

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/app/risks"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const sampleRisks = [
  {
    id: 1,
    risk_name: "Beta outage",
    risk_description: "",
    probability: 5,
    impact: 4,
    score: 20,
    status: "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items_count: 0,
  },
  {
    id: 2,
    risk_name: "Alpha latency",
    risk_description: "",
    probability: 1,
    impact: 4,
    score: 4,
    status: "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    action_items_count: 0,
  },
];

describe("RisksList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sorts by score desc in table view by default and toggles sort by name", async () => {
    (listRisks as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      sampleRisks
    );

    renderWithProviders(<RisksList />);

    // Switch to table view
    const tableToggle = await screen.findByRole("button", {
      name: /table view/i,
    });
    await userEvent.click(tableToggle);

    // Rows should appear sorted by score desc: Beta outage (20) before Alpha latency (4)
    const rows = await screen.findAllByRole("row");
    // Skip header row
    const dataRows = rows.slice(1);
    const firstRow = within(dataRows[0]);
    expect(firstRow.getByText(/Beta outage/i)).toBeInTheDocument();

    // Click Risk header to sort by name (desc default), then click again to toggle asc
    const riskHeader = screen.getByRole("columnheader", { name: /risk/i });
    await userEvent.click(riskHeader);
    await userEvent.click(riskHeader);

    const rowsAfter = await screen.findAllByRole("row");
    const dataRowsAfter = rowsAfter.slice(1);
    const firstAfter = within(dataRowsAfter[0]);
    expect(firstAfter.getByText(/Alpha latency/i)).toBeInTheDocument();
  });

  it("applies filters: status and search trigger data refetch with params", async () => {
    const mock = listRisks as unknown as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue(sampleRisks);

    renderWithProviders(<RisksList />);

    // Type into search
    const searchBox = await screen.findByPlaceholderText(/search risks/i);
    await userEvent.type(searchBox, "latency");

    // Change status filter
    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[0];
    await userEvent.selectOptions(statusSelect as HTMLSelectElement, "open");

    // Allow react-query to refetch; we expect listRisks to be called with params containing search and status
    // We'll wait a tick and then inspect last call
    await new Promise((r) => setTimeout(r, 50));

    const lastCall = mock.mock.calls.at(-1);
    expect(lastCall).toBeTruthy();
    const args = lastCall![0];
    expect(args).toMatchObject({ search: "latency", status: "open" });
  });

  it("shows view and edit links in table view", async () => {
    (listRisks as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      sampleRisks
    );

    renderWithProviders(<RisksList />);
    const tableToggle = await screen.findByRole("button", {
      name: /table view/i,
    });
    await userEvent.click(tableToggle);

    // Actions column has a View link to /app/risks/1
    const links = await screen.findAllByRole("link", { name: /view details/i });
    expect(links[0]).toHaveAttribute("href", "/app/risks/1");

    // Edit link should also be present from mocked permissions
    const editLinks = await screen.findAllByRole("link", {
      name: /edit risk/i,
    });
    expect(editLinks[0]).toHaveAttribute("href", "/app/risks/1/edit");
  });
});
