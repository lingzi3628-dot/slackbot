/**
 * Style rules for react-native-markdown-display.
 * Mirrors the web app's styled renderer (ember-tinted inline code, fire
 * accent headings, dark code blocks).
 */
import type { StyleObj } from "react-native-markdown-display";
import type { Theme } from "./theme";

export function buildMarkdownRules(theme: Theme) {
  return {
    body: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
    } as StyleObj,
    heading1: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
    } as StyleObj,
    heading2: {
      fontSize: 19,
      fontWeight: "700" as const,
      color: theme.text,
      marginTop: 14,
      marginBottom: 6,
    } as StyleObj,
    heading3: {
      fontSize: 17,
      fontWeight: "600" as const,
      color: theme.text,
      marginTop: 12,
      marginBottom: 4,
    } as StyleObj,
    paragraph: {
      marginTop: 0,
      marginBottom: 10,
      color: theme.text,
    } as StyleObj,
    code_inline: {
      backgroundColor: theme.primaryMuted,
      color: theme.text,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      fontFamily: "monospace",
      fontSize: 13,
    } as StyleObj,
    code_block: {
      backgroundColor: theme.codeBackground,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: "monospace",
      fontSize: 13,
      color: theme.text,
    } as StyleObj,
    fence: {
      backgroundColor: theme.codeBackground,
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      fontFamily: "monospace",
      fontSize: 13,
      color: theme.text,
    } as StyleObj,
    bullet_list: {
      marginVertical: 6,
    } as StyleObj,
    ordered_list: {
      marginVertical: 6,
    } as StyleObj,
    list_item: {
      marginVertical: 3,
    } as StyleObj,
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
      paddingLeft: 10,
      marginVertical: 8,
      opacity: 0.85,
    } as StyleObj,
    link: {
      color: theme.primary,
      textDecorationLine: "underline" as const,
    } as StyleObj,
    table: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 6,
      marginVertical: 8,
    } as StyleObj,
    th: {
      backgroundColor: theme.surfaceElevated,
      padding: 6,
      fontWeight: "600" as const,
      color: theme.text,
    } as StyleObj,
    td: {
      padding: 6,
      color: theme.text,
    } as StyleObj,
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    } as StyleObj,
    hr: {
      backgroundColor: theme.border,
      height: 1,
      marginVertical: 12,
    } as StyleObj,
    strong: {
      fontWeight: "700" as const,
      color: theme.text,
    } as StyleObj,
    em: {
      fontStyle: "italic" as const,
      color: theme.textMuted,
    } as StyleObj,
  };
}
