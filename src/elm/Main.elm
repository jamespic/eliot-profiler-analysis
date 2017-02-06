module Main exposing (..)

import Date exposing (Date)
import Date.Extra.Format exposing (utcIsoString)
import Dict exposing (Dict)
import Html exposing (..)
import RouteUrl exposing (RouteUrlProgram, UrlChange)
import RouteUrl.Builder exposing (..)
import Navigation exposing (Location)
import UrlParser exposing (..)


orderKey : String
orderKey =
    "_order"


startDateKey : String
startDateKey =
    "_start_date"


endDateKey : String
endDateKey =
    "_end_date"


startRecordKey : String
startRecordKey =
    "_start_record"


countKey : String
countKey =
    "_count"


main : RouteUrlProgram Never Model Action
main =
    RouteUrl.program
        { delta2url = delta2url
        , location2messages = url2messages
        , init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


type alias StartDate =
    Maybe Date


type alias EndDate =
    Maybe Date


type alias SearchTerms =
    Dict String String


type alias Search =
    { order : SearchOrder
    , startDate : Maybe Date
    , endDate : Maybe Date
    , terms : SearchTerms
    }


type Action
    = ViewProfile String
    | SearchProfiles Search


type SearchOrder
    = Newest
    | Oldest


type alias Model =
    { profileId : Maybe String
    , search : Search
    }


init : ( Model, Cmd Action )
init =
    ( { profileId = Nothing
      , search =
            { order = Newest
            , startDate = Nothing
            , endDate = Nothing
            , terms = Dict.empty
            }
      }
    , Cmd.none
    )


subscriptions : Model -> Sub Action
subscriptions model =
    Sub.none


update : Action -> Model -> ( Model, Cmd Action )
update action model =
    let
        newModel =
            case action of
                ViewProfile profileId ->
                    { model | profileId = Just profileId }

                SearchProfiles search ->
                    { model | profileId = Nothing, search = search }
    in
        ( newModel, Cmd.none )


view : Model -> Html Action
view model = case model.profileId of
  Just profileId -> h1 [] [text "loading ", text profileId]
  Nothing -> h1 [] [text "Searching for ", text (toString model.search)]



delta2url : Model -> Model -> Maybe UrlChange
delta2url oldModel newModel =
    case newModel.profileId of
        Just profileId ->
            if newModel.profileId == oldModel.profileId then
                Nothing
            else
                Just (builder |> newEntry |> appendToPath [ "profile", profileId ] |> toUrlChange)

        Nothing ->
            if newModel.search == oldModel.search then
                Nothing
            else
                Just (searchUrlChange newModel.search)


maybeUpdateDict : comparable -> (a -> b) -> Maybe a -> Dict comparable b -> Dict comparable b
maybeUpdateDict key formatter value =
    case value of
        Nothing ->
            identity

        Just a ->
            Dict.insert key (formatter a)


searchUrlChange : Search -> UrlChange
searchUrlChange search =
    builder
        |> newEntry
        |> modifyQuery
            (Dict.insert orderKey
                (case search.order of
                    Newest ->
                        "newest"

                    Oldest ->
                        "oldest"
                )
            )
        |> modifyQuery (maybeUpdateDict startDateKey utcIsoString search.startDate)
        |> modifyQuery (maybeUpdateDict endDateKey utcIsoString search.endDate)
        |> modifyQuery (Dict.union search.terms)
        |> toUrlChange


parseOrder : Maybe String -> SearchOrder
parseOrder order =
    case order of
        Just "newest" ->
            Newest

        Just "oldest" ->
            Oldest

        _ ->
            Newest


urlParser : Parser (Action -> c) c
urlParser =
    UrlParser.oneOf
        [ UrlParser.map ViewProfile (UrlParser.s "profile" </> UrlParser.string)
        , UrlParser.map SearchProfiles
            (UrlParser.map Search
                (UrlParser.s "search"
                    <?> customParam orderKey parseOrder
                    <?> dateParam startDateKey
                    <?> dateParam endDateKey
                    <?> dictParam (String.startsWith "_")
                )
            )
        ]


url2messages : Location -> List Action
url2messages location = case parsePath urlParser location of
  Just a -> [a]
  Nothing -> []



-- module Main exposing (..)
--
-- import Html exposing (..)
-- import Html.Attributes exposing (..)
-- import Html.Events exposing (..)
-- import Navigation
--
--
-- main : Program Never Model Msg
-- main =
--     Navigation.program UrlChange
--         { init = init
--         , view = view
--         , update = update
--         , subscriptions = (\_ -> Sub.none)
--         }
--
--
--
-- -- MODEL
--
--
-- type alias Model =
--     { history : List Navigation.Location
--     }
--
--
-- init : Navigation.Location -> ( Model, Cmd Msg )
-- init location =
--     ( Model [ location ]
--     , Cmd.none
--     )
--
--
--
-- -- UPDATE
--
--
-- type Msg
--     = UrlChange Navigation.Location
--
--
--
-- {- We are just storing the location in our history in this example, but
--    normally, you would use a package like evancz/url-parser to parse the path
--    or hash into nicely structured Elm values.
--
--        <http://package.elm-lang.org/packages/evancz/url-parser/latest>
--
-- -}
--
--
-- update : Msg -> Model -> ( Model, Cmd Msg )
-- update msg model =
--     case msg of
--         UrlChange location ->
--             ( { model | history = location :: model.history }
--             , Cmd.none
--             )
--
--
--
-- -- VIEW
--
--
-- view : Model -> Html msg
-- view model =
--     div []
--         [ h1 [] [ text "Pages" ]
--         , ul [] (List.map viewLink [ "bears", "cats", "dogs", "elephants", "fish" ])
--         , h1 [] [ text "History" ]
--         , ul [] (List.map viewLocation model.history)
--         ]
--
--
-- viewLink : String -> Html msg
-- viewLink name =
--     li [] [ a [ href ("#" ++ name) ] [ text name ] ]
--
--
-- viewLocation : Navigation.Location -> Html msg
-- viewLocation location =
--     li [] [ text (location.pathname ++ location.hash) ]
