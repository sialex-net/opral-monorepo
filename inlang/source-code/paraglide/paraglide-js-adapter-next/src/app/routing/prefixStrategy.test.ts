import { it, expect, describe } from "vitest"
import { PrefixStrategy } from "./prefixStrategy"

const { getCanonicalPath, getLocalisedHref } = PrefixStrategy({
	availableLanguageTags: ["en", "de", "de-CH"],
	defaultLanguage: "en",
	pathnames: {
		"/canonical-translated": {
			de: "/uebersetzt",
			"de-CH": "/uebersetzt",
			en: "/translated",
		},
		"/canonical-translated/[id]": {
			de: "/uebersetzt/[id]",
			"de-CH": "/uebersetzt/[id]",
			en: "/translated/[id]",
		},
	},
	exclude: (path) => path.startsWith("/api/"),
	prefix: "except-default",
})

describe("getCanonicalPath", () => {
	it("get's the canonical path for just the language prefix", () => {
		expect(getCanonicalPath("/de", "de")).toBe("/")
		expect(getCanonicalPath("/en", "en")).toBe("/")
		expect(getCanonicalPath("/", "en")).toBe("/")
		expect(getCanonicalPath("/de-CH", "de-CH")).toBe("/")
	})

	it("removes the language prefix if there is one", () => {
		expect(getCanonicalPath("/de/some/path", "de")).toBe("/some/path")
		expect(getCanonicalPath("/en/some/path", "en")).toBe("/some/path")
		expect(getCanonicalPath("/de-CH/some/path", "de-CH")).toBe("/some/path")
	})

	it("returns the path if there is no language prefix", () => {
		expect(getCanonicalPath("/some/path", "en")).toBe("/some/path")
	})

	it("get's the canonical path for translated paths", () => {
		expect(getCanonicalPath("/de/uebersetzt", "de")).toBe("/canonical-translated")
		expect(getCanonicalPath("/en/translated", "en")).toBe("/canonical-translated")
		expect(getCanonicalPath("/de-CH/uebersetzt", "de-CH")).toBe("/canonical-translated")
	})

	it("get's the canonical path for translated paths with params", () => {
		expect(getCanonicalPath("/de/uebersetzt/1", "de")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/en/translated/1", "en")).toBe("/canonical-translated/1")
		expect(getCanonicalPath("/de-CH/uebersetzt/1", "de-CH")).toBe("/canonical-translated/1")
	})
})

describe("getLocalisedPath", () => {
	it("adds a language prefix if there isn't one", () => {
		expect(getLocalisedHref("/some/path", "de", "en", "")).toEqual({ pathname: "/de/some/path" })
		expect(getLocalisedHref("/some/path", "de-CH", "de-CH", "")).toEqual({
			pathname: "/de-CH/some/path",
		})
		expect(getLocalisedHref("/", "de", "de", "")).toEqual({ pathname: "/de" })
		expect(getLocalisedHref("/", "de-CH", "de", "")).toEqual({ pathname: "/de-CH" })
		expect(getLocalisedHref("/", "en", "de", "")).toEqual({ pathname: "/" })
	})

	it("does not add a language prefix if the new locale is the source language tag", () => {
		expect(getLocalisedHref("/some/path", "en", "en", "")).toEqual({ pathname: "/some/path" })
	})

	it("does not localise excluded paths", () => {
		expect(getLocalisedHref("/api/some/path", "de", "en", "")).toEqual({
			pathname: "/api/some/path",
		})
	})

	it("get's translated paths", () => {
		expect(getLocalisedHref("/canonical-translated", "de", "de", "")).toEqual({
			pathname: "/de/uebersetzt",
		})
		expect(getLocalisedHref("/canonical-translated", "en", "de", "")).toEqual({
			pathname: "/translated",
		})
		expect(getLocalisedHref("/canonical-translated", "de-CH", "de", "")).toEqual({
			pathname: "/de-CH/uebersetzt",
		})
	})

	it("get's translated paths with params", () => {
		expect(getLocalisedHref("/canonical-translated/1", "de", "en", "")).toEqual({
			pathname: "/de/uebersetzt/1",
		})
		expect(getLocalisedHref("/canonical-translated/1", "en", "en", "")).toEqual({
			pathname: "/translated/1",
		})
		expect(getLocalisedHref("/canonical-translated/1", "de-CH", "de-CH", "")).toEqual({
			pathname: "/de-CH/uebersetzt/1",
		})
	})
})
