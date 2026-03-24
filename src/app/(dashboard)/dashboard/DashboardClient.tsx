"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, FileText } from "lucide-react";
import CreatePageModal from "./CreatePageModal";

const FREE_PAGE_LIMIT = 1;

type StatusPage = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

type Props = {
  pages: StatusPage[];
};

export default function DashboardClient({ pages }: Props) {
  const [showModal, setShowModal] = useState(false);
  const atLimit = pages.length >= FREE_PAGE_LIMIT;

  return (
    <>
      {pages.length === 0 ? (
        <div
          className="rounded-[4px] flex flex-col items-center text-center py-20"
          style={{ border: "1.5px dashed #c4bfb4", background: "white" }}
        >
          <div
            className="w-12 h-12 rounded-[4px] flex items-center justify-center mb-6"
            style={{
              background: "rgba(232,80,10,0.08)",
              border: "1px solid rgba(232,80,10,0.15)",
            }}
          >
            <FileText size={22} style={{ color: "#e8500a" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: "1.2rem",
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            No status pages yet
          </h2>
          <p
            className="text-sm max-w-xs mb-8 leading-relaxed"
            style={{ color: "#8a8070" }}
          >
            Create your first status page and start keeping your users informed
            when things go wrong.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-[4px] px-5 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer"
            style={{
              background: "#1a1714",
              color: "#f5f2eb",
              border: "1.5px solid #1a1714",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e8500a";
              e.currentTarget.style.borderColor = "#e8500a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1a1714";
              e.currentTarget.style.borderColor = "#1a1714";
            }}
          >
            <Plus size={15} />
            Create status page
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <p
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "#8a8070" }}
            >
              {pages.length} / {FREE_PAGE_LIMIT} page used
            </p>
            <button
              onClick={() => !atLimit && setShowModal(true)}
              disabled={atLimit}
              className="flex items-center gap-2 rounded-[4px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: atLimit ? "#e4dfd4" : "#1a1714",
                color: atLimit ? "#8a8070" : "#f5f2eb",
                border: `1.5px solid ${atLimit ? "#e4dfd4" : "#1a1714"}`,
              }}
              onMouseEnter={(e) => {
                if (!atLimit) {
                  e.currentTarget.style.background = "#e8500a";
                  e.currentTarget.style.borderColor = "#e8500a";
                }
              }}
              onMouseLeave={(e) => {
                if (!atLimit) {
                  e.currentTarget.style.background = "#1a1714";
                  e.currentTarget.style.borderColor = "#1a1714";
                }
              }}
              title={atLimit ? "Upgrade to Pro to create more pages" : ""}
            >
              <Plus size={13} />
              New page
            </button>
          </div>

          {/* Page cards */}
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between px-6 py-5 rounded-[4px] bg-white"
              style={{
                border: "1.5px solid #e4dfd4",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "#1a1714")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "#e4dfd4")
              }
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-[4px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#f5f2eb",
                    border: "1.5px solid #e4dfd4",
                  }}
                >
                  <FileText size={15} style={{ color: "#8a8070" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-head)",
                      fontWeight: 800,
                      fontSize: "1rem",
                      letterSpacing: "-0.02em",
                      color: "#1a1714",
                    }}
                  >
                    {page.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8a8070" }}>
                    statsy.page/{page.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors duration-150 px-3 py-2 rounded-[4px]"
                  style={{
                    color: "#8a8070",
                    border: "1.5px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#1a1714";
                    e.currentTarget.style.borderColor = "#e4dfd4";
                    e.currentTarget.style.background = "#f5f2eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8a8070";
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.background = "transparent";
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={13} />
                  Public page
                </a>
                <Link
                  href={`/dashboard/${page.slug}`}
                  className="flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150"
                  style={{
                    border: "1.5px solid #1a1714",
                    color: "#1a1714",
                    background: "white",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a1714";
                    e.currentTarget.style.color = "#f5f2eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.color = "#1a1714";
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}

          {atLimit && (
            <p className="text-xs mt-1" style={{ color: "#8a8070" }}>
              You've reached the Free plan limit.{" "}
              <button
                className="font-semibold hover:underline underline-offset-2"
                style={{ color: "#e8500a" }}
              >
                Upgrade to Pro
              </button>{" "}
              to create more pages.
            </p>
          )}
        </div>
      )}

      {showModal && <CreatePageModal onClose={() => setShowModal(false)} />}
    </>
  );
}
