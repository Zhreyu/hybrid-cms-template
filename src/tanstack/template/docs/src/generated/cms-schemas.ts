export interface Header {
  icon?: {
    _asset?: {
      url?: string;
      mime_type?: string;
    };
    alt?: string;
  };
  logo_text?: string;
  admin_panel_label?: string;
  admin_panel_href?: string;
  search_placeholder?: string;
  nav_links?: Array<{
    label?: string;
    href?: string;
    active?: boolean;
  }>;
}

export interface Uifooter {
  powered_by?: {
    _asset?: {
      url?: string;
      mime_type?: string;
    };
    alt?: string;
  };
  poweredby_url?: string;
  x_url?: string;
  github_url?: string;
  linkedin_url?: string;
}
