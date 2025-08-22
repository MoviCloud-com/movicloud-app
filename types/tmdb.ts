 // TMDB API 类型定义
export interface TMDBMovie {
    id: number
    title: string
    overview: string
    poster_path: string
    backdrop_path: string
    release_date: string
    vote_average: number
    vote_count: number
    genre_ids: number[]
    original_language: string
    popularity: number
  adult?: boolean
  original_title?: string
  video?: boolean
  }
  
  export interface TMDBSeries {
    id: number
    name: string
    overview: string
    poster_path: string
    backdrop_path: string
    first_air_date: string
    vote_average: number
    vote_count: number
    genre_ids: number[]
    original_language: string
    popularity: number
  adult?: boolean
  original_name?: string
  origin_country?: string[]
  }
  
  export interface TMDBGenre {
    id: number
    name: string
  }
  
  export interface TMDBResponse<T> {
    page: number
    results: T[]
    total_pages: number
    total_results: number
  }
  
  export interface TMDBConfig {
    apiKey: string
    apiBaseUrl: string
    imageBaseUrl: string
    proxyEnabled: boolean
  }
  
  export interface TMDBPerson {
    id: number
    name: string
    profile_path: string
    biography: string
    birthday: string
    place_of_birth: string
    popularity: number
  }
  
  export interface TMDBImage {
    file_path: string
    width: number
    height: number
    iso_639_1?: string
    aspect_ratio: number
    vote_average: number
    vote_count: number
  }
  
  export interface TMDBVideo {
    id: string
    key: string
    name: string
    site: string
    size: number
    type: string
    official: boolean
    published_at: string
  iso_639_1?: string
  iso_3166_1?: string
}

export interface TMDBProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface TMDBProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TMDBSpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface TMDBSeason {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}

export interface TMDBNetwork {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface TMDBCreatedBy {
  id: number
  credit_id: string
  name: string
  original_name: string
  gender: number
  profile_path: string
}

export interface TMDBCast {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string
  character: string
  credit_id: string
  order: number
}

export interface TMDBCrew {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
  credit_id: string
  department: string
  job: string
}

export interface TMDBLastEpisodeToAir {
  id: number
  name: string
  overview: string
  vote_average: number
  vote_count: number
  air_date: string
  episode_number: number
  episode_type: string
  production_code: string
  runtime: number
  season_number: number
  show_id: number
  still_path: string
  }
  
  export interface TMDBMovieDetails extends TMDBMovie {
  adult: boolean
  belongs_to_collection: any | null
  budget: number
  genres: TMDBGenre[]
  homepage: string
  imdb_id: string
  origin_country: string[]
  production_companies: TMDBProductionCompany[]
  production_countries: TMDBProductionCountry[]
  revenue: number
    runtime: number
  spoken_languages: TMDBSpokenLanguage[]
    status: string
    tagline: string
  video: boolean
    credits: {
    cast: TMDBCast[]
    crew: TMDBCrew[]
    }
    videos: {
      results: TMDBVideo[]
    }
    images: {
      backdrops: TMDBImage[]
    logos: TMDBImage[]
      posters: TMDBImage[]
    }
    similar: TMDBResponse<TMDBMovie>
    recommendations: TMDBResponse<TMDBMovie>
  }
  
  export interface TMDBSeriesDetails extends TMDBSeries {
  adult: boolean
  backdrop_path: string
  created_by: TMDBCreatedBy[]
  episode_run_time: number[]
  first_air_date: string
  genres: TMDBGenre[]
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: TMDBLastEpisodeToAir | null
  name: string
  next_episode_to_air: any | null
  networks: TMDBNetwork[]
  number_of_episodes: number
    number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: TMDBProductionCompany[]
  production_countries: TMDBProductionCountry[]
  seasons: TMDBSeason[]
  spoken_languages: TMDBSpokenLanguage[]
    status: string
  tagline: string
    type: string
  vote_average: number
  vote_count: number
    credits: {
    cast: TMDBCast[]
    crew: TMDBCrew[]
    }
    videos: {
      results: TMDBVideo[]
    }
    images: {
      backdrops: TMDBImage[]
    logos: TMDBImage[]
      posters: TMDBImage[]
    }
    similar: TMDBResponse<TMDBSeries>
    recommendations: TMDBResponse<TMDBSeries>
  }