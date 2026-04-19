"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useToast } from "@/lib/use-toast";

type Props = {
    onClose: () => void;
};

function slugify(str: string) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

type FieldErrors = {
    name?: string;
    slug?: string;
};

export default function CreatePageModal({ onClose }: Props) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isRefreshing, startRefresh] = useTransition();

    const router = useRouter();
    const { success, error: showError } = useToast();

    useEffect(() => {
        if (submitted && !isRefreshing) {
            success(`${name.trim()} created successfully!`);
            setLoading(false);
            setSubmitted(false);
            onClose();
        }
    }, [submitted, isRefreshing, name, success, onClose]);

    function handleNameChange(val: string) {
        setName(val);
        setFieldErrors((prev) => ({ ...prev, name: undefined }));
        if (!slugManuallyEdited) {
            setSlug(slugify(val));
            setFieldErrors((prev) => ({ ...prev, slug: undefined }));
        }
    }

    function handleSlugChange(val: string) {
        setSlugManuallyEdited(true);
        setSlug(slugify(val));
        setFieldErrors((prev) => ({ ...prev, slug: undefined }));
    }

    function validate(): boolean {
        const errors: FieldErrors = {};
        if (!name.trim()) {
            errors.name = "Name is required.";
        }
        if (!slug.trim()) {
            errors.slug = "Slug is required.";
        } else if (!/^[a-z0-9-]+$/.test(slug)) {
            errors.slug = "Lowercase letters, numbers, and hyphens only.";
        } else if (slug.length < 3) {
            errors.slug = "Slug must be at least 3 characters.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        const res = await fetch("/api/status-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
        });

        if (!res.ok) {
            const { error } = await res.json();
            setLoading(false);
            if (res.status === 409) {
                setFieldErrors((prev) => ({
                    ...prev,
                    slug: "This slug is already taken. Try another.",
                }));
                showError("This slug is already taken.");
            } else {
                showError(error ?? "Something went wrong. Please try again.");
            }
            return;
        }

        setSubmitted(true);
        startRefresh(() => {
            router.refresh();
        });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(26,23,20,0.5)" }}
        >
            <div
                className="w-full max-w-md bg-white rounded-[4px]"
                style={{
                    border: "1.5px solid #1a1714",
                    boxShadow: "6px 6px 0 #1a1714",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-8 pt-7 pb-6"
                    style={{ borderBottom: "1.5px solid #e4dfd4" }}
                >
                    <h2
                        style={{
                            fontFamily: "var(--font-head)",
                            fontWeight: 900,
                            fontSize: "1.4rem",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        New status page
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={loading || isRefreshing}
                        className="transition-colors rounded-[4px] p-1 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        style={{ color: "#8a8070" }}
                        onMouseEnter={(e) =>
                            !(loading || isRefreshing) &&
                            (e.currentTarget.style.color = "#1a1714")
                        }
                        onMouseLeave={(e) =>
                            !(loading || isRefreshing) &&
                            (e.currentTarget.style.color = "#8a8070")
                        }
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="px-8 py-6 flex flex-col gap-5"
                >
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs font-semibold uppercase tracking-[0.08em]"
                            style={{ color: "#3d3830" }}
                        >
                            Page name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Acme Status"
                            disabled={loading || isRefreshing}
                            className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] disabled:opacity-50"
                            style={{
                                border: `1.5px solid ${fieldErrors.name ? "#e8500a" : "#e4dfd4"}`,
                                color: "#1a1714",
                            }}
                        />
                        {fieldErrors.name && (
                            <p className="text-xs" style={{ color: "#e8500a" }}>
                                {fieldErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs font-semibold uppercase tracking-[0.08em]"
                            style={{ color: "#3d3830" }}
                        >
                            URL slug
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="your-slug"
                            disabled={loading || isRefreshing}
                            className="rounded-[4px] px-4 py-3 text-sm outline-none bg-white placeholder:text-[#c4bfb4] disabled:opacity-50"
                            style={{
                                border: `1.5px solid ${fieldErrors.slug ? "#e8500a" : "#e4dfd4"}`,
                                color: "#1a1714",
                            }}
                        />
                        {fieldErrors.slug ? (
                            <p className="text-xs" style={{ color: "#e8500a" }}>
                                {fieldErrors.slug}
                            </p>
                        ) : slug ? (
                            <p className="text-xs" style={{ color: "#1a7a4a" }}>
                                Your page will be live at{" "}
                                <span className="font-mono font-medium">
                                    {slug}.statsy.page
                                </span>
                            </p>
                        ) : (
                            <p className="text-xs" style={{ color: "#8a8070" }}>
                                Lowercase letters, numbers, and hyphens only.
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading || isRefreshing}
                            className="flex-1 rounded-[4px] py-3 text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                border: "1.5px solid #e4dfd4",
                                color: "#3d3830",
                                background: "white",
                                fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={(e) =>
                                !loading &&
                                (e.currentTarget.style.borderColor = "#1a1714")
                            }
                            onMouseLeave={(e) =>
                                !loading &&
                                (e.currentTarget.style.borderColor = "#e4dfd4")
                            }
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isRefreshing}
                            className="flex-1 rounded-[4px] py-3 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            style={{
                                background: (loading || isRefreshing) ? "#8a8070" : "#1a1714",
                                color: "#f5f2eb",
                                border: `1.5px solid ${(loading || isRefreshing) ? "#8a8070" : "#1a1714"}`,
                                fontFamily: "var(--font-body)",
                            }}
                            onMouseEnter={(e) => {
                                if (!(loading || isRefreshing)) {
                                    e.currentTarget.style.background =
                                        "#e8500a";
                                    e.currentTarget.style.borderColor =
                                        "#e8500a";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!(loading || isRefreshing)) {
                                    e.currentTarget.style.background =
                                        "#1a1714";
                                    e.currentTarget.style.borderColor =
                                        "#1a1714";
                                }
                            }}
                        >
                            {(loading || isRefreshing) ? "Creating..." : "Create page"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
