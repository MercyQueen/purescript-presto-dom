module PrestoDOM.Types.Core
    ( PropName(..)
    , PrestoDOM
    , toPropValue
    , Component
    , module VDom
    , module Types
    , class IsProp
    ) where

import Prelude

import Control.Monad.Eff (Eff)
import DOM (DOM)
import Data.Foreign (Foreign)
import Data.Foreign.Class (class Decode, class Encode, encode)
import Data.Foreign.Generic (defaultOptions, genericDecode, genericEncode)
import Data.Generic.Rep (class Generic)
import Data.Generic.Rep.Show (genericShow)
import Data.Newtype (class Newtype)
import FRP (FRP)
import FRP.Event (Event, subscribe)
import Halogen.VDom.DOM.Prop (Prop, PropValue, propFromBoolean, propFromInt, propFromNumber, propFromString)
import Halogen.VDom.Types (VDom(..), ElemSpec(..), ElemName(..), Namespace(..)) as VDom
import Halogen.VDom.Types (VDom)
import PrestoDOM.Types.DomAttributes (Length, renderLength)
import PrestoDOM.Types.DomAttributes as Types

newtype PropName value = PropName String
type PrestoDOM i w = VDom (Array (Prop i)) w

type Component action st eff =
  {
    initialState :: st
  , view :: (action -> Eff (frp :: FRP, dom :: DOM | eff) Unit) -> st -> VDom (Array (Prop action)) Void
  , eval :: action -> st -> st
  }


derive instance newtypePropName :: Newtype (PropName value) _

class IsProp a where
  toPropValue :: a -> PropValue

instance stringIsProp :: IsProp String where
  toPropValue = propFromString

instance intIsProp :: IsProp Int where
  toPropValue = propFromInt

instance numberIsProp :: IsProp Number where
  toPropValue = propFromNumber

instance booleanIsProp :: IsProp Boolean where
  toPropValue = propFromBoolean

instance lengthIsProp :: IsProp Length where
  toPropValue = propFromString <<< renderLength