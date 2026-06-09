export type CmsImageReference = {
  _asset?: {
    id?: string;
    url?: string;
    mime_type?: string;
  };
  alt?: string;
  caption?: string;
  attribution?: string;
};

export type HeaderBlockContent = {
  icon?: CmsImageReference;
  logo_text?: string;
  admin_panel_label?: string;
  admin_panel_href?: string;
  search_placeholder?: string;
  nav_links?: Record<string, unknown>[];
};

export type FooterBlockContent = {
  powered_by?: CmsImageReference;
  x_url?: string;
  github_url?: string;
  linkedin_url?: string;
  poweredby_url?: string;
  status_page_url?: string;
};
