// Full citations for every short reference the report text can emit, keyed
// by the exact short form used in insight cite strings. The references test
// walks buildInsights output and fails if an insight ever cites something
// missing here — short marks in the text, full scholarship at the end.

export interface Reference { full: string; url: string }

export const REFERENCES: Record<string, Reference> = {
  "Malouff et al., 2010": {
    full: "Malouff, J. M., Thorsteinsson, E. B., Schutte, N. S., Bhullar, N., & Rooke, S. E. (2010). The Five-Factor Model of personality and relationship satisfaction of intimate partners: A meta-analysis. Journal of Research in Personality, 44(1), 124–127.",
    url: "https://doi.org/10.1016/j.jrp.2009.09.004",
  },
  "Dyrenforth et al., 2010": {
    full: "Dyrenforth, P. S., Kashy, D. A., Donnellan, M. B., & Lucas, R. E. (2010). Predicting relationship and life satisfaction from personality in nationally representative samples. Journal of Personality and Social Psychology, 99(4), 690–702.",
    url: "https://doi.org/10.1037/a0020385",
  },
  "Barrick & Mount, 1991": {
    full: "Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. Personnel Psychology, 44(1), 1–26.",
    url: "https://doi.org/10.1111/j.1744-6570.1991.tb00688.x",
  },
  "Roberts et al., 2007": {
    full: "Roberts, B. W., Kuncel, N. R., Shiner, R., Caspi, A., & Goldberg, L. R. (2007). The power of personality: The comparative validity of personality traits, socioeconomic status, and cognitive ability for predicting important life outcomes. Perspectives on Psychological Science, 2(4), 313–345.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4499872/",
  },
  "Judge et al., 2002": {
    full: "Judge, T. A., Bono, J. E., Ilies, R., & Gerhardt, M. W. (2002). Personality and leadership: A qualitative and quantitative review. Journal of Applied Psychology, 87(4), 765–780.",
    url: "https://doi.org/10.1037/0021-9010.87.4.765",
  },
  "Bell, 2007": {
    full: "Bell, S. T. (2007). Deep-level composition variables as predictors of team performance: A meta-analysis. Journal of Applied Psychology, 92(3), 595–615.",
    url: "https://doi.org/10.1037/0021-9010.92.3.595",
  },
  "Pletzer et al., 2019": {
    full: "Pletzer, J. L., Bentvelzen, M., Oostrom, J. K., & de Vries, R. E. (2019). Comparing domain- and facet-level relations of the HEXACO personality model with workplace deviance: A meta-analysis. Personality and Individual Differences, 152, 109539.",
    url: "https://doi.org/10.1016/j.paid.2019.109539",
  },
  "McCarthy et al., 2023": {
    full: "McCarthy, P. X., Gong, X., Braesemann, F., Stephany, F., Rizoiu, M.-A., & Kern, M. L. (2023). The impact of founder personalities on startup success. Scientific Reports, 13, 17200.",
    url: "https://www.nature.com/articles/s41598-023-41980-y",
  },
  "Higgins, 1987": {
    full: "Higgins, E. T. (1987). Self-discrepancy: A theory relating self and affect. Psychological Review, 94(3), 319\u2013340.",
    url: "https://doi.org/10.1037/0033-295X.94.3.319",
  },
  "Markus & Nurius, 1986": {
    full: "Markus, H., & Nurius, P. (1986). Possible selves. American Psychologist, 41(9), 954\u2013969.",
    url: "https://doi.org/10.1037/0003-066X.41.9.954",
  },
  "Hudson & Fraley, 2015": {
    full: "Hudson, N. W., & Fraley, R. C. (2015). Volitional personality trait change: Can people choose to change their personality traits? Journal of Personality and Social Psychology, 109(3), 490\u2013507.",
    url: "https://doi.org/10.1037/pspp0000021",
  },
  "Holland, 1997": {
    full: "Holland, J. L. (1997). Making Vocational Choices: A Theory of Vocational Personalities and Work Environments (3rd ed.). Psychological Assessment Resources.",
    url: "https://psycnet.apa.org/record/1997-08980-000",
  },
  "Rounds et al. (O*NET Mini-IP)": {
    full: "Rounds, J., Wee, C. J. M., Cao, M., Song, C., & Lewis, P. Development of an O*NET Mini Interest Profiler (Mini-IP) for Mobile Devices: Psychometric Characteristics. National Center for O*NET Development.",
    url: "https://www.onetcenter.org/reports/Mini-IP.html",
  },
};
