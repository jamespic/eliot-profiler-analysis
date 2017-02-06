module CallGraph exposing (..)

import Json.Decode as Decode
import Json.Decode.Pipeline as Pipeline
import Date exposing (Date)
import Dict exposing (Dict)


type JsValue
    = JsObject (Dict String JsValue)
    | JsArray (List JsValue)
    | JsString String
    | JsNumber Float
    | JsBoolean Bool
    | JsNull


type CallGraph
    = CallGraph InnerCallGraph


type alias InnerCallGraph =
    { instruction : Maybe String
    , start_time : Date
    , end_time : Date
    , time : Float
    , self_time : Float
    , thread : Maybe Int
    , task_uuid : Maybe String
    , message : Maybe JsValue
    , children : List CallGraph
    }


jsValue : Decode.Decoder JsValue
jsValue =
    Decode.lazy
        (\_ ->
            Decode.oneOf
                [ Decode.map JsObject (Decode.dict jsValue)
                , Decode.map JsArray (Decode.list jsValue)
                , Decode.map JsString Decode.string
                , Decode.map JsNumber Decode.float
                , Decode.map JsBoolean Decode.bool
                , Decode.null JsNull
                ]
        )


date : Decode.Decoder Date
date =
    Decode.andThen
        (\s ->
            case Date.fromString (s) of
                Ok date ->
                    Decode.succeed date

                Err error ->
                    Decode.fail error
        )
        Decode.string


callGraph : Decode.Decoder CallGraph
callGraph =
    Decode.lazy
        (\_ ->
            Decode.map CallGraph
                (Pipeline.decode InnerCallGraph
                    |> Pipeline.optional "instruction" (Decode.maybe Decode.string) Nothing
                    |> Pipeline.required "start_time" date
                    |> Pipeline.required "end_time" date
                    |> Pipeline.required "time" Decode.float
                    |> Pipeline.required "self_time" Decode.float
                    |> Pipeline.optional "thread" (Decode.maybe Decode.int) Nothing
                    |> Pipeline.optional "task_uuid" (Decode.maybe Decode.string) Nothing
                    |> Pipeline.optional "message" (Decode.maybe jsValue) Nothing
                    |> Pipeline.optional "children" (Decode.list callGraph) []
                )
        )
