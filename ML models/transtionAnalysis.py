# -*- coding: utf-8 -*-
"""
Created on Sun Oct 11 09:22:51 2020

@author: Mohit M More
"""


import numpy as np
import pandas as pd

df=pd.read_csv('H:\Projects\VIT Hack 2020\DummyBills.csv')

sumOfMainItems=pd.DataFrame(df.sum(axis=0))
nameOfHighestItem=sumOfMainItems.idxmax()
lowestItemSold=sumOfMainItems.idxmin()

list=df.columns.values
list=np.delete(list,np.where(list==lowestItemSold))

print(list)
dataFrameforsuggestions=df[df[lowestItemSold]>0].loc[:,list]

finalSuggestion=pd.DataFrame(dataFrameforsuggestions.sum(axis=0))

finalNameforSuggestion = finalSuggestion.idxmax()

print(finalNameforSuggestion)